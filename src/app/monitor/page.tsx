'use client';

import React, { useState, useEffect } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle,
  XCircle,
  MessageSquare,
  CreditCard,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
});

interface Notification {
  _id: string;
  storeId: string;
  customerId: string;
  contractId: string;
  type: 'redemption' | 'extension';
  status: 'pending' | 'confirmed' | 'rejected' | 'payment_pending' | 'completed';
  message: string;
  customerName: string;
  phone: string;
  responseMessage: string;
  qrCodeUrl: string;
  paymentProofUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function MonitorPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
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
      } else if (response.status === 401) {
        router.push('/auth/signin');
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch notifications error:', err);
    }
    setLoading(false);
  };

  // Handle notification action
  const handleNotificationAction = async (notificationId: string, action: 'confirm' | 'reject', responseMessage?: string) => {
    setActionLoading(notificationId);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const response = await fetch(`/api/notifications/${notificationId}/actions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          responseMessage: responseMessage || ''
        })
      });

      if (response.ok) {
        // Refresh notifications
        await fetchNotifications();
        setSelectedNotification(null);
      } else {
        alert('Action failed');
      }
    } catch (err) {
      alert('Network error');
      console.error('Action error:', err);
    }
    setActionLoading(null);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'รอการยืนยัน' },
      confirmed: { color: 'bg-blue-100 text-blue-800', text: 'ยืนยันแล้ว' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธแล้ว' },
      payment_pending: { color: 'bg-orange-100 text-orange-800', text: 'รอหลักฐานการโอน' },
      completed: { color: 'bg-green-100 text-green-800', text: 'เสร็จสิ้น' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    const typeConfig = {
      redemption: { color: 'bg-purple-100 text-purple-800', text: 'ไถ่ถอน' },
      extension: { color: 'bg-indigo-100 text-indigo-800', text: 'ต่อดอกเบี้ย' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.redemption;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Polling for real-time updates
  useEffect(() => {
    fetchNotifications();

    // Poll every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <FixedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </FixedLayout>
    );
  }

  return (
    <FixedLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-3">
                <Bell className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className={`text-2xl font-bold text-gray-900 ${sarabun.className}`}>
                    ระบบแจ้งเตือน
                  </h1>
                  <p className={`text-sm text-gray-600 ${sarabun.className}`}>
                    จัดการคำขอจากลูกค้าและหลักฐานการชำระเงิน
                  </p>
                </div>
              </div>

              <button
                onClick={fetchNotifications}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className={sarabun.className}>รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Notifications Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getTypeBadge(notification.type)}
                    {getStatusBadge(notification.status)}
                  </div>
                  <span className={`text-xs text-gray-500 ${sarabun.className}`}>
                    {new Date(notification.createdAt).toLocaleString('th-TH')}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="mb-4">
                  <h3 className={`font-semibold text-gray-900 ${sarabun.className}`}>
                    {notification.customerName}
                  </h3>
                  <p className={`text-sm text-gray-600 ${sarabun.className}`}>
                    เบอร์โทร: {notification.phone}
                  </p>
                  {notification.message && (
                    <p className={`text-sm text-gray-700 mt-2 ${sarabun.className}`}>
                      "{notification.message}"
                    </p>
                  )}
                </div>

                {/* Payment Proof */}
                {notification.paymentProofUrl && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium text-gray-700 mb-2 ${sarabun.className}`}>
                      หลักฐานการโอนเงิน:
                    </p>
                    <img
                      src={notification.paymentProofUrl}
                      alt="Payment Proof"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {notification.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setSelectedNotification(notification)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        disabled={actionLoading === notification._id}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className={sarabun.className}>ตอบกลับ</span>
                      </button>
                    </>
                  )}

                  {notification.status === 'payment_pending' && (
                    <>
                      <button
                        onClick={() => handleNotificationAction(notification._id, 'confirm', 'ตรวจสอบเรียบร้อยแล้ว')}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        disabled={actionLoading === notification._id}
                      >
                        {actionLoading === notification._id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span className={sarabun.className}>ยืนยัน</span>
                      </button>

                      <button
                        onClick={() => setSelectedNotification(notification)}
                        className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        disabled={actionLoading === notification._id}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className={sarabun.className}>ปฏิเสธ</span>
                      </button>
                    </>
                  )}

                  {notification.status === 'completed' && (
                    <div className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span className={sarabun.className}>เสร็จสิ้น</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className={`text-gray-500 text-lg ${sarabun.className}`}>
                ไม่มีแจ้งเตือนใหม่
              </p>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className={`text-lg font-semibold mb-4 ${sarabun.className}`}>
                ตอบกลับคำขอ{selectedNotification.type === 'redemption' ? 'ไถ่ถอน' : 'ต่อดอกเบี้ย'}
              </h3>

              <div className="mb-4">
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${sarabun.className}`}>
                  ข้อความตอบกลับ (ไม่บังคับ)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  id="responseMessage"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const message = (document.getElementById('responseMessage') as HTMLTextAreaElement)?.value;
                    handleNotificationAction(selectedNotification._id, 'confirm', message);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={actionLoading === selectedNotification._id}
                >
                  {actionLoading === selectedNotification._id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className={sarabun.className}>ยอมรับ</span>
                </button>

                <button
                  onClick={() => {
                    const message = (document.getElementById('responseMessage') as HTMLTextAreaElement)?.value;
                    handleNotificationAction(selectedNotification._id, 'reject', message);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={actionLoading === selectedNotification._id}
                >
                  <XCircle className="h-4 w-4" />
                  <span className={sarabun.className}>ปฏิเสธ</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                className={`mt-4 w-full text-gray-600 hover:text-gray-800 ${sarabun.className}`}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>
    </FixedLayout>
  );
}
