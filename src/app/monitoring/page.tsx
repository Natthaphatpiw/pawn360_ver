'use client';

import React, { useState, useEffect } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  XCircle,
  MessageCircle,
  Upload,
  Eye,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar
} from 'lucide-react';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
});

interface Notification {
  _id: string;
  type: 'redemption' | 'interest_renewal';
  status: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'completed';
  customer: {
    name: string;
    phone: string;
    lineId: string;
  };
  contract: {
    contractNumber: string;
    item: string;
    amount: number;
  };
  message: string;
  qrCodeUrl?: string;
  slipUrl?: string;
  createdAt: string;
  updatedAt: string;
  responseMessage?: string;
  actions: Array<{
    action: 'approve' | 'reject' | 'confirm_payment';
    message?: string;
    timestamp: string;
  }>;
}

interface NotificationCardProps {
  notification: Notification;
  onAction: (notificationId: string, action: string, message?: string) => void;
  onViewSlip: (slipUrl: string) => void;
  onUploadSlip: (notificationId: string, file: File) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onAction,
  onViewSlip,
  onUploadSlip
}) => {
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'รอดำเนินการ' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'อนุมัติแล้ว' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'ปฏิเสธแล้ว' },
      payment_pending: { color: 'bg-orange-100 text-orange-800', icon: CreditCard, text: 'รอการชำระเงิน' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'เสร็จสิ้น' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      redemption: { color: 'bg-purple-100 text-purple-800', text: 'ไถ่ถอน' },
      interest_renewal: { color: 'bg-indigo-100 text-indigo-800', text: 'ต่อดอกเบี้ย' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.redemption;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleSlipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingSlip(true);
    try {
      await onUploadSlip(notification._id, file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('อัพโหลดสลิปไม่สำเร็จ');
    } finally {
      setUploadingSlip(false);
      event.target.value = '';
    }
  };

  const canTakeAction = notification.status === 'pending' || notification.status === 'payment_pending';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {notification.contract.contractNumber}
            </h3>
            <p className="text-sm text-gray-600">{notification.contract.item}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getTypeBadge(notification.type)}
          {getStatusBadge(notification.status)}
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">ข้อมูลลูกค้า</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">ชื่อ:</span> {notification.customer.name}</div>
          <div><span className="font-medium">โทร:</span> {notification.customer.phone}</div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">รายละเอียดสัญญา</h4>
        <div className="text-sm">
          <div><span className="font-medium">จำนวนเงิน:</span> ฿{notification.contract.amount.toLocaleString()}</div>
          <div><span className="font-medium">ข้อความ:</span> {notification.message}</div>
        </div>
      </div>

      {/* QR Code Display (for redemption) */}
      {notification.type === 'redemption' && notification.qrCodeUrl && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">QR Code สำหรับชำระเงิน</h4>
          <div className="flex justify-center">
            <img
              src={notification.qrCodeUrl}
              alt="Payment QR Code"
              className="w-32 h-32 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Slip Upload/Display */}
      {notification.type === 'redemption' && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">หลักฐานการชำระเงิน</h4>
          {notification.slipUrl ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">อัพโหลดสลิปแล้ว</span>
              <button
                onClick={() => onViewSlip(notification.slipUrl!)}
                className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                <Eye className="w-4 h-4 mr-1" />
                ดูสลิป
              </button>
            </div>
          ) : notification.status === 'approved' ? (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                {uploadingSlip ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="text-xs text-gray-500 mt-1">กำลังอัพโหลด...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">คลิกเพื่ออัพโหลดสลิป</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlipUpload}
                  disabled={uploadingSlip}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2 text-center">
                PNG, JPG, GIF สูงสุด 5MB
              </p>
            </div>
          ) : (
            <span className="text-sm text-gray-500">รอการอนุมัติก่อน</span>
          )}
        </div>
      )}

      {/* Action History */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">ประวัติการดำเนินการ</h4>
          <div className="space-y-2">
            {notification.actions.map((action, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-center space-x-2">
                <span className="font-medium capitalize">{action.action}:</span>
                <span>{action.message || 'ดำเนินการแล้ว'}</span>
                <span>({new Date(action.timestamp).toLocaleString('th-TH')})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canTakeAction && (
        <div className="flex flex-col space-y-3">
          {!showResponseForm ? (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowResponseForm(true)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                ตอบกลับ
              </button>

              {notification.status === 'pending' && (
                <>
                  <button
                    onClick={() => onAction(notification._id, 'approve')}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => onAction(notification._id, 'reject')}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    ปฏิเสธ
                  </button>
                </>
              )}

              {notification.status === 'payment_pending' && (
                <button
                  onClick={() => onAction(notification._id, 'confirm_payment')}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ยืนยันการชำระเงิน
                </button>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
              />
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => {
                    onAction(notification._id, 'respond', responseMessage);
                    setShowResponseForm(false);
                    setResponseMessage('');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ส่งข้อความ
                </button>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseMessage('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        สร้างเมื่อ: {new Date(notification.createdAt).toLocaleString('th-TH')}
        {notification.updatedAt !== notification.createdAt && (
          <span className="ml-4">
            อัพเดทล่าสุด: {new Date(notification.updatedAt).toLocaleString('th-TH')}
          </span>
        )}
      </div>
    </div>
  );
};

export default function MonitoringPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'payment_pending'>('all');
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notificationId: string, action: string, message?: string) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, message })
      });

      if (response.ok) {
        // Refresh notifications
        fetchNotifications();
      } else {
        alert('Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Action failed');
    }
  };

  const handleViewSlip = (slipUrl: string) => {
    setSelectedSlip(slipUrl);
  };

  const handleUploadSlip = async (notificationId: string, file: File) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('slip', file);

      const response = await fetch(`/api/notifications/${notificationId}/upload-slip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        fetchNotifications();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload slip error:', error);
      throw error;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.status === filter;
  });

  if (loading) {
    return (
      <FixedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FixedLayout>
    );
  }

  if (error) {
    return (
      <FixedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </FixedLayout>
    );
  }

  return (
    <FixedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold text-gray-900 mb-2 ${sarabun.className}`}>
              ระบบแจ้งเตือน
            </h1>
            <p className="text-gray-600">
              จัดการคำขอจากลูกค้าผ่าน LINE สำหรับการไถ่ถอนและต่อดอกเบี้ย
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                ทั้งหมด ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                รอดำเนินการ ({notifications.filter(n => n.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('payment_pending')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'payment_pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                รอการชำระเงิน ({notifications.filter(n => n.status === 'payment_pending').length})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีแจ้งเตือน</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'ยังไม่มีคำขอจากลูกค้า' : `ไม่มีคำขอที่${filter === 'pending' ? 'รอดำเนินการ' : 'รอการชำระเงิน'}`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  onAction={handleNotificationAction}
                  onViewSlip={handleViewSlip}
                  onUploadSlip={handleUploadSlip}
                />
              ))
            )}
          </div>
        </div>

        {/* Slip Viewer Modal */}
        {selectedSlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">หลักฐานการชำระเงิน</h3>
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="flex justify-center">
                <img
                  src={selectedSlip}
                  alt="Payment Slip"
                  className="max-w-full max-h-96 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </FixedLayout>
  );
}
