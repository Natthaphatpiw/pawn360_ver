'use client';

import React, { useState, useEffect } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import { useRouter } from 'next/navigation';
import {
  User,
  Building,
  Edit,
  Upload,
  Save,
  Plus,
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';
import { Sarabun } from 'next/font/google';
import InterestPresetSettings from '@/components/settings/InterestPresetSettings';

const sarabun = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'],
});

interface StoreData {
  storeName: string;
  address: {
    houseNumber: string;
    village: string;
    street: string;
    subDistrict: string;
    district: string;
    province: string;
    country: string;
    postcode: string;
  };
  phone: string;
  taxId: string;
  googlemap: string;
  bankUrl: string;
  interestPerday: number;
  interestSet: { [key: string]: number };
  interestPresets: {
    days: number;
    rate: number;
  }[];
  contractTemplate: {
    header: string;
    footer: string;
    terms: string;
  };
  delayed: {
    maxday: number;
    feeperday: number;
  };
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'members'>('store');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStores, setUserStores] = useState<any[]>([]);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const [showCreateStoreModal, setShowCreateStoreModal] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [qrCodeUploading, setQrCodeUploading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const [newStoreData, setNewStoreData] = useState<StoreData>({
    storeName: '',
    address: {
      houseNumber: '',
      village: '',
      street: '',
      subDistrict: '',
      district: '',
      province: '',
      country: 'ประเทศไทย',
      postcode: ''
    },
    phone: '',
    taxId: '',
    googlemap: '',
    bankUrl: '',
    interestPerday: 0.025,
    interestSet: {
      '7': 0.07,
      '14': 0.08,
      '30': 0.10
    },
    interestPresets: [
      { days: 7, rate: 3 },
      { days: 15, rate: 5 },
      { days: 30, rate: 10 }
    ],
    contractTemplate: {
      header: 'สัญญาจำนำทองคำ',
      footer: 'ขอบคุณที่ใช้บริการ',
      terms: 'เงื่อนไขการจำนำมาตรฐาน'
    },
    delayed: {
      maxday: 7,
      feeperday: 100
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showStoreDropdown) {
        setShowStoreDropdown(false);
      }
    };

    if (showStoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStoreDropdown]);

  // Fetch user data and stores
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!userStr || !token) {
          router.push('/auth/login');
          return;
        }

        const userData = JSON.parse(userStr);
        setUser(userData);

        // Fetch user's stores
        const storesResponse = await fetch('/api/stores', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (storesResponse.ok) {
          const stores = await storesResponse.json();
          setUserStores(stores);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Fetch customers when members tab is active or selected store changes
  useEffect(() => {
    const fetchCustomers = async () => {
      if (activeTab !== 'members' || userStores.length === 0) return;

      try {
        setLoadingCustomers(true);
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const currentStore = userStores[selectedStoreIndex];
        if (!currentStore) return;

        // Fetch customers from the selected store only
        const response = await fetch(`/api/customers?store_id=${currentStore._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const storeCustomers = await response.json();
          setCustomers(storeCustomers);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [activeTab, userStores, selectedStoreIndex]);

  const handleCreateStore = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Map frontend field names to backend expected field names
      const backendData = {
        store_name: newStoreData.storeName,
        address: newStoreData.address,
        phone: newStoreData.phone,
        tax_id: newStoreData.taxId,
        googlemap: newStoreData.googlemap,
        bankUrl: newStoreData.bankUrl,
        interestPerday: newStoreData.interestPerday,
        interestSet: newStoreData.interestSet,
        interestPresets: newStoreData.interestPresets,
        contractTemplate: newStoreData.contractTemplate,
        delayed: newStoreData.delayed
      };

        const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      });

      if (response.ok) {
        const newStore = await response.json();
        setUserStores(prev => [...prev, newStore]);
        setShowCreateStoreModal(false);
        setNewStoreData({
          storeName: '',
          address: {
            houseNumber: '',
            village: '',
            street: '',
            subDistrict: '',
            district: '',
            province: '',
            country: 'ประเทศไทย',
            postcode: ''
          },
          phone: '',
          taxId: '',
          googlemap: '',
          bankUrl: '',
          interestPerday: 0.025,
          interestSet: {
            '7': 0.07,
            '14': 0.08,
            '30': 0.10
          },
          interestPresets: [
            { days: 7, rate: 3 },
            { days: 15, rate: 5 },
            { days: 30, rate: 10 }
          ],
          contractTemplate: {
            header: 'สัญญาจำนำทองคำ',
            footer: 'ขอบคุณที่ใช้บริการ',
            terms: 'เงื่อนไขการจำนำมาตรฐาน'
          },
          delayed: {
            maxday: 7,
            feeperday: 100
          }
        });
        alert('Store created successfully!');
      } else {
        alert('Failed to create store');
      }
    } catch (err) {
      console.error('Error creating store:', err);
      alert('Failed to create store');
    }
  };

  const handleNewStoreDataChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewStoreData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof StoreData] as any),
          [child]: value
        }
      }));
    } else {
      setNewStoreData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleInterestPresetsChange = (presets: {days: number, rate: number}[]) => {
    setNewStoreData(prev => ({
      ...prev,
      interestPresets: presets
    }));
  };

  // Handle QR Code upload
  const handleQrCodeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }

    setQrCodeUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'bank');
      formDataUpload.append('storeId', 'temp'); // Temporary store ID, will be updated after store creation

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Get presigned URL for preview
      const urlParts = data.url.split('/');
      const key = urlParts.slice(-2).join('/'); // Get the last two parts (e.g., temp/bank/userId_timestamp.png)
      const presignedResponse = await fetch(`/api/files/presigned?key=${key}`);
      const presignedData = await presignedResponse.json();

      setQrCodeUrl(presignedData.presignedUrl || data.url);
      setNewStoreData(prev => ({
        ...prev,
        bankUrl: data.url // Keep the S3 URL for storage, use presigned for display
      }));

    } catch (error) {
      console.error('QR Code upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setQrCodeUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const TitleBadge = ({ text }: { text: string }) => (
    <div className={`bg-[#CAC8C8] text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md ${sarabun.className}`}>
      {text}
    </div>
  );

  if (loading) {
    return (
      <FixedLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </FixedLayout>
    );
  }

  const currentStore = userStores[selectedStoreIndex];

  return (
    <FixedLayout>
      <div className={`flex flex-col lg:flex-row h-full gap-1 ${sarabun.className}`}>
        {/* Left Panel - Scrollable */}
        <div className="w-full lg:w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Header */}
          <div className="bg-[#F5F4F2] rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">Account Management</h1>
                <TitleBadge text="จัดการบัญชี" />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-8 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-[#E8B4A0] text-[#8B4513]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className={`px-8 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'store'
                    ? 'bg-[#E8B4A0] text-[#8B4513]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Store Management
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-8 py-3 rounded-full font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'bg-[#E8B4A0] text-[#8B4513]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Members
              </button>
            </div>

            {/* Profile Tab Content */}
            {activeTab === 'profile' && (
              <div className={`space-y-6 ${sarabun.className}`}>
                <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-1 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                    <TitleBadge text="ข้อมูลผู้ใช้" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Full name</label>
                      <div className="text-xs text-gray-500 mb-2">ชื่อ - นามสกุล</div>
                      <div className="text-gray-900 font-medium">{user?.full_name || 'ไม่ระบุ'}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Email</label>
                      <div className="text-xs text-gray-500 mb-2">อีเมลล์</div>
                      <div className="text-gray-900 font-medium">{user?.email || 'ไม่ระบุ'}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Role</label>
                      <div className="text-xs text-gray-500 mb-2">บทบาท</div>
                      <div className="text-gray-900 font-medium">{user?.role || 'ไม่ระบุ'}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Total Stores</label>
                      <div className="text-xs text-gray-500 mb-2">จำนวนร้านค้า</div>
                      <div className="text-gray-900 font-medium">{userStores.length} ร้าน</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Store Tab Content */}
            {activeTab === 'store' && (
              <div className={`space-y-6 ${sarabun.className}`}>
                {/* Store Selector */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">Store Selection</h3>
                      <TitleBadge text="เลือกร้าน" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          🏪 {userStores[selectedStoreIndex]?.storeName || `Store ${selectedStoreIndex + 1}`}
                          <ChevronDown size={14} />
                        </button>
                        {showStoreDropdown && (
                          <div
                            className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px] p-2"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-1">
                              {userStores.map((store, index) => (
                                <label
                                  key={store._id}
                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStoreIndex(index);
                                    setShowStoreDropdown(false);
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name="storeSelection"
                                    checked={selectedStoreIndex === index}
                                    readOnly
                                    className="w-4 h-4"
                                  />
                                  <span>🏪 {store.storeName || `Store ${index + 1}`}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowCreateStoreModal(true)}
                        className="px-4 py-2 bg-[#386337] text-white rounded-lg hover:bg-[#0A4215] transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create Store
                      </button>
                    </div>
                  </div>
                </div>

                {currentStore ? (
                  <>
                    {/* General Section */}
                    <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-1 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">General</h3>
                        <TitleBadge text="ทั่วไป" />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Store name</label>
                          <div className="text-xs text-gray-500 mb-2">ชื่อร้าน</div>
                          <div className="text-gray-900 font-medium">{currentStore.storeName}</div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Phone</label>
                          <div className="text-xs text-gray-500 mb-2">เบอร์โทรศัพท์</div>
                          <div className="text-gray-900 font-medium">{currentStore.phone}</div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-900 block">Tax ID</label>
                          <div className="text-xs text-gray-500 mb-2">เลขผู้เสียภาษี</div>
                          <div className="text-gray-900 font-medium">{currentStore.taxId}</div>
                        </div>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-1 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                        <TitleBadge text="ที่อยู่" />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Address (เลขที่)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.houseNumber || '-'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Village/Building (หมู่บ้าน/อาคาร)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.village || '-'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Street (ตรอก/ซอย/ถนน)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.street || '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Sub-district (แขวง/ตำบล)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.subDistrict || '-'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">District (เขต/อำเภอ)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.district || '-'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Province (จังหวัด)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.province || '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Country (ประเทศ)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.country || 'ประเทศไทย'}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-900 block">Postcode (รหัสไปรษณีย์)</label>
                          <div className="text-gray-900 font-medium mt-2">{currentStore.address?.postcode || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
                    <Building size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No stores found. Create your first store to get started.</p>
                    <button
                      onClick={() => setShowCreateStoreModal(true)}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Plus size={16} />
                      Create Your First Store
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Members Tab Content */}
            {activeTab === 'members' && (
              <div className={`space-y-6 ${sarabun.className}`}>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold text-gray-900">Customers</h2>
                      <TitleBadge text="ลูกค้า" />
                    </div>
                    <button
                      onClick={() => router.push('/pawn-entry')}
                      className="px-4 py-2 bg-[#487C47] text-white rounded-lg hover:bg-[#386337] transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Customer
                    </button>
                  </div>

                  {loadingCustomers ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Loading customers...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-12">
                      <User size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">No customers yet</p>
                      <button
                        onClick={() => router.push('/pawn-entry')}
                        className="px-6 py-3 bg-[#487C47] text-white rounded-lg hover:bg-[#386337] transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus size={16} />
                        Add Your First Customer
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">ID Number</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Contracts</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Value</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Contract</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map((customer) => (
                            <tr key={customer._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 ">
                                <div className="font-medium text-gray-900">{customer.fullName}</div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{customer.phone}</td>
                              <td className="py-3 px-4 text-gray-600">{customer.idNumber}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {customer.totalContracts || 0}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-gray-900">
                                ฿{(customer.totalValue || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center text-gray-600 text-sm">
                                {customer.lastContractDate ? 
                                  new Date(customer.lastContractDate).toLocaleDateString('th-TH') : 
                                  '-'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Customer Statistics */}
                {customers.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">Total Customers</div>
                      <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">Total Contracts</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {customers.reduce((sum, c) => sum + (c.totalContracts || 0), 0)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="text-sm text-gray-600 mb-2">Total Value</div>
                      <div className="text-2xl font-bold text-gray-900">
                        ฿{customers.reduce((sum, c) => sum + (c.totalValue || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Quick Actions</h3>
              <TitleBadge text="เมนูด่วน" />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-[#386337] text-white py-3 rounded-lg hover:bg-[#0A4215] transition-colors font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/contracts')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                View Contracts
              </button>
              <button
                onClick={() => router.push('/pawn-entry')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                New Contract
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Summary</h3>
              <TitleBadge text="สรุปผู้ใช้" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email</span>
                <span className="font-medium text-gray-900 text-sm">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Role</span>
                <span className="font-medium text-gray-900 text-sm">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Stores</span>
                <span className="font-medium text-gray-900 text-sm">{userStores.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Store Modal */}
      {showCreateStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Store</h2>
              <button
                onClick={() => setShowCreateStoreModal(false)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Store Name</label>
                  <input
                    type="text"
                    value={newStoreData.storeName}
                    onChange={(e) => handleNewStoreDataChange('storeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter store name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Phone</label>
                  <input
                    type="text"
                    value={newStoreData.phone}
                    onChange={(e) => handleNewStoreDataChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Tax ID</label>
                <input
                  type="text"
                  value={newStoreData.taxId}
                  onChange={(e) => handleNewStoreDataChange('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter tax ID"
                />
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Google Maps URL</label>
                <input
                  type="url"
                  value={newStoreData.googlemap}
                  onChange={(e) => handleNewStoreDataChange('googlemap', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              {/* Daily Interest Rate */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Daily Interest Rate (%)</label>
                <input
                  type="number"
                  value={newStoreData.interestPerday}
                  onChange={(e) => handleNewStoreDataChange('interestPerday', parseFloat(e.target.value) || 0)}
                  step="0.001"
                  min="0"
                  max="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.025"
                />
              </div>

              {/* Max Late Days */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Maximum Late Days</label>
                <input
                  type="number"
                  value={newStoreData.delayed.maxday}
                  onChange={(e) => handleNewStoreDataChange('delayed.maxday', parseInt(e.target.value) || 0)}
                  min="0"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="7"
                />
              </div>

              {/* Late Fee Per Day */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">Late Fee Per Day (฿)</label>
                <input
                  type="number"
                  value={newStoreData.delayed.feeperday}
                  onChange={(e) => handleNewStoreDataChange('delayed.feeperday', parseFloat(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">House Number</label>
                  <input
                    type="text"
                    value={newStoreData.address.houseNumber}
                    onChange={(e) => handleNewStoreDataChange('address.houseNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="เลขที่"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Village</label>
                  <input
                    type="text"
                    value={newStoreData.address.village}
                    onChange={(e) => handleNewStoreDataChange('address.village', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="หมู่บ้าน/อาคาร"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Street</label>
                  <input
                    type="text"
                    value={newStoreData.address.street}
                    onChange={(e) => handleNewStoreDataChange('address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ตรอก/ซอย/ถนน"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Sub-district</label>
                  <input
                    type="text"
                    value={newStoreData.address.subDistrict}
                    onChange={(e) => handleNewStoreDataChange('address.subDistrict', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="แขวง/ตำบล"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">District</label>
                  <input
                    type="text"
                    value={newStoreData.address.district}
                    onChange={(e) => handleNewStoreDataChange('address.district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="เขต/อำเภอ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Province</label>
                  <input
                    type="text"
                    value={newStoreData.address.province}
                    onChange={(e) => handleNewStoreDataChange('address.province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="จังหวัด"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Country</label>
                  <input
                    type="text"
                    value={newStoreData.address.country}
                    onChange={(e) => handleNewStoreDataChange('address.country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">Postcode</label>
                  <input
                    type="text"
                    value={newStoreData.address.postcode}
                    onChange={(e) => handleNewStoreDataChange('address.postcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="รหัสไปรษณีย์"
                  />
                </div>
              </div>
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Bank QR Code (Optional)</label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    {qrCodeUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <span className="text-xs text-gray-500 mt-1">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs text-gray-500 mt-1">QR Code</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrCodeUpload}
                      disabled={qrCodeUploading}
                      className="hidden"
                    />
                  </label>

                  {qrCodeUrl && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                        <img
                          src={qrCodeUrl}
                          alt="Bank QR Code"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs text-green-600 mt-1">Uploaded</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  อัพโหลด QR Code สำหรับการชำระเงินผ่านธนาคาร (PNG, JPG, GIF สูงสุด 5MB)
                </p>
              </div>
            </div>

            {/* Interest Preset Settings */}
            <div className="mt-8">
              <InterestPresetSettings
                interestPresets={newStoreData.interestPresets}
                onInterestPresetsChange={handleInterestPresetsChange}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateStoreModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStore}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Store
              </button>
            </div>
          </div>
        </div>
      )}
    </FixedLayout>
  );
}