'use client';

import React, { useState } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import {
  User,
  Building,
  Edit,
  Upload,
  Save,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { Sarabun } from 'next/font/google';

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
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  interestPresets: {
    days: number;
    rate: number;
  }[];
}

interface UserData {
  fullName: string;
  email: string;
  role: string;
  phone: string;
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
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'members'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  const TitleBadge = ({ text }: { text: string }) => (
    <div className={`bg-[#CAC8C8] text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md ${sarabun.className}`}>
      {text}
    </div>
  );

  const [storeData, setStoreData] = useState<StoreData>({
    storeName: 'Suradech Pichaiyuthasak',
    address: {
      houseNumber: '5/14',
      village: '-',
      street: 'ซอย บานา, ถนน สุขุมวิท',
      subDistrict: 'คลองเตยเหนือ',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      country: 'ประเทศไทย',
      postcode: '10110'
    },
    phone: '000-000-0000',
    taxId: '0000000000000',
    interestPresets: [
      { days: 7, rate: 3.0 },
      { days: 15, rate: 5.0 },
      { days: 30, rate: 10.0 }
    ]
  });

  const [userData, setUserData] = useState<UserData>({
    fullName: 'Suradech Pichaiyuthasak',
    email: 'email@email.com',
    role: 'Owner',
    phone: '000-000-0000',
    address: {
      houseNumber: '5/14',
      village: '-',
      street: 'ซอย บานา, ถนน สุขุมวิท',
      subDistrict: 'คลองเตยเหนือ',
      district: 'วัฒนา',
      province: 'กรุงเทพมหานคร',
      country: 'ประเทศไทย',
      postcode: '10110'
    }
  });

  const handleStoreDataChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setStoreData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof StoreData] as any),
          [child]: value
        }
      }));
    } else {
      setStoreData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleUserDataChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setUserData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserData] as any),
          [child]: value
        }
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };


  const handleSave = () => {
    console.log('Saving data:', { storeData, userData });
    setIsEditing(false);
  };

  return (
    <FixedLayout>
      <div className={`flex h-full gap-1 ${sarabun.className}`}>
        {/* Left Panel - Scrollable */}
        <div className="w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Header */}
          <div className="bg-[#F5F4F2] rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">Store setting</h1>
                <TitleBadge text="ตั้งค่าร้าน" />
              </div>
              {isEditing && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 text-gray-600 hover:text-[#487C47] hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Save size={20} />
                  </button>
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-[#487C47] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={20} />
                </button>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6">
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
                Store
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

              {/* Store Tab Content */}
              {activeTab === 'store' && (
                <div className={`space-y-6 ${sarabun.className}`}>
                  {/* General Section */}
                  <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <h3 className="text-lg font-semibold text-gray-900">General</h3>
                        <TitleBadge text="ทั่วไป" />
                      </div>
                      {isEditing && (
                        <Edit size={16} className="text-gray-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Store name</label>
                        <div className="text-xs text-gray-500 mb-2">ชื่อร้าน</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.storeName}
                            onChange={(e) => handleStoreDataChange('storeName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium">{storeData.storeName}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">สุรเดช พิชัยยุทธศักดิ์</div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Phone</label>
                        <div className="text-xs text-gray-500 mb-2">เบอร์โทรศัพท์</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.phone}
                            onChange={(e) => handleStoreDataChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium">{storeData.phone}</div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-900 block">Tax ID</label>
                        <div className="text-xs text-gray-500 mb-2">เลขผู้เสียภาษี</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.taxId}
                            onChange={(e) => handleStoreDataChange('taxId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium">{storeData.taxId}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                        <TitleBadge text="ที่อยู่" />
                      </div>
                      {isEditing && (
                        <Edit size={16} className="text-gray-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Address (เลขที่)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.houseNumber || ''}
                            onChange={(e) => handleStoreDataChange('address.houseNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.houseNumber}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Village/Building (หมู่บ้าน/อาคาร)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.village || ''}
                            onChange={(e) => handleStoreDataChange('address.village', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.village}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Street (ตรอก/ซอย/ถนน)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.street}
                            onChange={(e) => handleStoreDataChange('address.street', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.street}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Sub-district (แขวง/ตำบล)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.subDistrict}
                            onChange={(e) => handleStoreDataChange('address.subDistrict', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.subDistrict}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">District (เขต/อำเภอ)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.district}
                            onChange={(e) => handleStoreDataChange('address.district', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.district}</div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Province (จังหวัด)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.province}
                            onChange={(e) => handleStoreDataChange('address.province', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.province}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Country (ประเทศ)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={storeData.address.country || 'ประเทศไทย'}
                          onChange={(e) => handleStoreDataChange('address.country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{storeData.address.country || 'ประเทศไทย'}</div>
                      )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Postcode (รหัสไปรษณีย์)</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={storeData.address.postcode}
                            onChange={(e) => handleStoreDataChange('address.postcode', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                          />
                        ) : (
                          <div className="text-gray-900 font-medium mt-2">{storeData.address.postcode}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interest Preset Section */}
                  <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-1 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Interest Preset</h3>
                      <TitleBadge text="รูปแบบอัตราดอกเบี้ย" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">7 days</label>
                        <div className="text-xs text-gray-500 mb-2">7วัน</div>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                          <option>3%</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">15 days</label>
                        <div className="text-xs text-gray-500 mb-2">15วัน</div>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                          <option>5%</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">30 days</label>
                        <div className="text-xs text-gray-500 mb-2">30วัน</div>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                          <option>10%</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Plus size={16} />
                        Add period
                        <span className="text-xs text-gray-400">เพิ่มช่วงเวลา</span>
                      </button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Template Section */}
                  <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 block">Template name</label>
                        <div className="text-xs text-gray-500">ชื่อแบบฟอร์มสัญญา</div>
                        <div className="text-gray-900 font-medium mt-2">สัญญารูปแบบมาตรฐาน 1</div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Edit size={16} />
                        Edit Template
                        <span className="text-xs text-gray-400">กำหนดชื่อความสัญญา</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Profile Tab Content */}
            {activeTab === 'profile' && (
              <div className={`space-y-6 ${sarabun.className}`}>
                {/* General Section */}
                <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <h3 className="text-lg font-semibold text-gray-900">General</h3>
                      <TitleBadge text="ทั่วไป" />
                    </div>
                    {isEditing && (
                      <Edit size={16} className="text-gray-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Full name</label>
                      <div className="text-xs text-gray-500 mb-2">ชื่อ - นามสกุล</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.fullName}
                          onChange={(e) => handleUserDataChange('fullName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium">{userData.fullName}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">สุรเดช พิชัยยุทธศักดิ์</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Phone number</label>
                      <div className="text-xs text-gray-500 mb-2">เบอร์โทรศัพท์</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.phone}
                          onChange={(e) => handleUserDataChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium">{userData.phone}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Email</label>
                      <div className="text-xs text-gray-500 mb-2">อีเมลล์</div>
                      {isEditing ? (
                        <input
                          type="email"
                          value={userData.email}
                          onChange={(e) => handleUserDataChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium">{userData.email}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Roles</label>
                      <div className="text-xs text-gray-500 mb-2">บทบาท</div>
                      <div className="text-gray-900 font-medium">{userData.role}</div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-[#ffffff] rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                      <TitleBadge text="ที่อยู่" />
                    </div>
                    {isEditing && (
                      <Edit size={16} className="text-gray-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Address (เลขที่)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.houseNumber}
                          onChange={(e) => handleUserDataChange('address.houseNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.houseNumber}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Village/Building (หมู่บ้าน/อาคาร)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.village}
                          onChange={(e) => handleUserDataChange('address.village', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.village}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Street (ตรอก/ซอย/ถนน)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.street}
                          onChange={(e) => handleUserDataChange('address.street', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.street}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Sub-district (แขวง/ตำบล)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.subDistrict}
                          onChange={(e) => handleUserDataChange('address.subDistrict', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.subDistrict}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">District (เขต/อำเภอ)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.district}
                          onChange={(e) => handleUserDataChange('address.district', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.district}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Province (จังหวัด)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.province}
                          onChange={(e) => handleUserDataChange('address.province', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.province}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Country (ประเทศ)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.country}
                          onChange={(e) => handleUserDataChange('address.country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.country}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-900 block">Postcode (รหัสไปรษณีย์)</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={userData.address.postcode}
                          onChange={(e) => handleUserDataChange('address.postcode', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mt-2"
                        />
                      ) : (
                        <div className="text-gray-900 font-medium mt-2">{userData.address.postcode}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab Content */}
            {activeTab === 'members' && (
              <div className={`space-y-6 ${sarabun.className}`}>
                <div className="text-center py-12">
                  <User size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Members management coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Files Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Files</h3>
              <TitleBadge text="ไฟล์" />
            </div>

            <div className="space-y-6">
              {/* Store Logo */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Store Logo</h4>
                    <TitleBadge text="โลโก้ร้าน" />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            handleStoreDataChange('logoUrl', url);
                            console.log('Logo file selected:', file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50">
                      <Upload size={12} />
                      Upload
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1">File name</div>
                  <div className="text-xs text-gray-500">ชื่อไฟล์</div>
                  <div className="text-sm font-medium text-gray-900">
                    {storeData.logoUrl ? 'Uploaded logo.jpg' : 'Pawn store logo.jpg'}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 flex items-center justify-center min-h-[120px]">
                  {storeData.logoUrl ? (
                    <img
                      src={storeData.logoUrl}
                      alt="Store Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#2D4A87] rounded-full flex items-center justify-center mx-auto mb-2">
                        <div className="text-white text-xl font-bold transform rotate-12">↗</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">CASH EXPRESS</div>
                      <div className="text-xs text-gray-600 mt-1">จำนำกันใจ ได้เงินคันใช้</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stamp */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Stamp</h4>
                    <TitleBadge text="ตราประทับ" />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            handleStoreDataChange('stampUrl', url);
                            console.log('Stamp file selected:', file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50">
                      <Upload size={12} />
                      Upload
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1">File name</div>
                  <div className="text-xs text-gray-500">ชื่อไฟล์</div>
                  <div className="text-sm font-medium text-gray-900">
                    {storeData.stampUrl ? 'Uploaded stamp.png' : 'Pawn store stamp.png'}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 flex items-center justify-center min-h-[120px]">
                  {storeData.stampUrl ? (
                    <img
                      src={storeData.stampUrl}
                      alt="Store Stamp"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#4A4A4A] rounded-full flex items-center justify-center mx-auto mb-2">
                        <div className="text-white text-xl font-bold transform rotate-12">↗</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">CASH EXPRESS</div>
                      <div className="text-xs text-gray-600 mt-1">จำนำกันใจ ได้เงินคันใช้</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">Signature</h4>
                    <TitleBadge text="ลายเซ็น" />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            handleStoreDataChange('signatureUrl', url);
                            console.log('Signature file selected:', file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <button className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50">
                      <Upload size={12} />
                      Upload
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-gray-600 mb-1">File name</div>
                  <div className="text-xs text-gray-500">ชื่อไฟล์</div>
                  <div className="text-sm font-medium text-gray-900">
                    {storeData.signatureUrl ? 'Uploaded signature.png' : 'Pawn signature.png'}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 flex items-center justify-center min-h-[120px]">
                  {storeData.signatureUrl ? (
                    <img
                      src={storeData.signatureUrl}
                      alt="Signature"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg width="80" height="40" viewBox="0 0 80 40" className="mx-auto">
                        <path
                          d="M10 25 Q 20 15, 30 20 T 50 15 Q 60 20, 70 25"
                          stroke="#000"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}