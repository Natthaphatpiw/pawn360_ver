'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { 
  User, 
  Building, 
  Edit, 
  Upload, 
  Phone, 
  MapPin, 
  CreditCard,
  Save,
  Camera,
  Percent,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface StoreData {
  storeName: string;
  address: {
    street: string;
    subDistrict: string;
    district: string;
    province: string;
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
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'store' | 'profile'>('store');
  const [isEditing, setIsEditing] = useState(false);
  const [storeData, setStoreData] = useState<StoreData>({
    storeName: 'Pawn Store',
    address: {
      street: '',
      subDistrict: '',
      district: '',
      province: '',
      postcode: ''
    },
    phone: '',
    taxId: '',
    interestPresets: [
      { days: 7, rate: 3.0 }
    ]
  });

  const [userData, setUserData] = useState<UserData>({
    fullName: 'Demo Admin',
    email: 'demo@pawn360.com',
    role: 'admin'
  });

  const handleStoreDataChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setStoreData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof StoreData],
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
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInterestPreset = () => {
    setStoreData(prev => ({
      ...prev,
      interestPresets: [...prev.interestPresets, { days: 30, rate: 3.0 }]
    }));
  };

  const updateInterestPreset = (index: number, field: 'days' | 'rate', value: number) => {
    setStoreData(prev => ({
      ...prev,
      interestPresets: prev.interestPresets.map((preset, i) => 
        i === index ? { ...preset, [field]: value } : preset
      )
    }));
  };

  const removeInterestPreset = (index: number) => {
    setStoreData(prev => ({
      ...prev,
      interestPresets: prev.interestPresets.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Handle saving logic here
    console.log('Saving data:', { storeData, userData });
    setIsEditing(false);
  };

  const FileUploadSection = ({ title, subtitle, currentFile }: { title: string; subtitle: string; currentFile?: string }) => (
    <div className="space-y-3">
      <div>
        <h4 className="text-base font-medium text-d-grey-5">{title}</h4>
        <p className="text-sm text-clay-grey">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 border-2 border-dashed border-l-grey-3 rounded-lg flex items-center justify-center bg-l-grey-1">
          {currentFile ? (
            <div className="text-xs text-clay-grey text-center">
              <Camera size={20} className="mx-auto mb-1" />
              <div>File uploaded</div>
            </div>
          ) : (
            <div className="text-xs text-clay-grey text-center">
              <div>Click to upload an</div>
              <div>image</div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-d-grey-5">File name</div>
          <div className="text-sm text-clay-grey">ชื่อไฟล์</div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-l-grey-4 rounded-lg hover:bg-l-grey-1 transition-colors">
          <Upload size={16} />
          Upload
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-d-grey-5">Account</h1>
          </div>
          <div className="flex items-center gap-3">
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('store')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'store'
                  ? 'bg-leaf-green text-white'
                  : 'bg-l-grey-2 text-clay-grey hover:bg-l-grey-3'
              }`}
            >
              Store
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-leaf-green text-white'
                  : 'bg-l-grey-2 text-clay-grey hover:bg-l-grey-3'
              }`}
            >
              My Profile
            </button>
          </div>

          {/* Store Tab Content */}
          {activeTab === 'store' && (
            <div className="space-y-8">
              {/* General Section */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-d-grey-5">General</h3>
                  <span className="text-sm text-clay-grey">ทั่วไป</span>
                  {isEditing && (
                    <Edit size={16} className="text-clay-grey" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Store name
                    </label>
                    <p className="text-sm text-clay-grey mb-2">ชื่อร้าน</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.storeName}
                        onChange={(e) => handleStoreDataChange('storeName', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.storeName}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Tax ID
                    </label>
                    <p className="text-sm text-clay-grey mb-2">เลขผู้เสียภาษี</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.taxId}
                        onChange={(e) => handleStoreDataChange('taxId', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.taxId || 'Not set'}</div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Phone
                    </label>
                    <p className="text-sm text-clay-grey mb-2">เบอร์โทรศัพท์</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={storeData.phone}
                        onChange={(e) => handleStoreDataChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.phone || 'Not set'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-d-grey-5">Address</h3>
                  <span className="text-sm text-clay-grey">ที่อยู่</span>
                  {isEditing && (
                    <Edit size={16} className="text-clay-grey" />
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Address (เลขที่)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.address.street}
                        onChange={(e) => handleStoreDataChange('address.street', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.address.street || 'Not set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Village/Building (หมู่บ้าน/อาคาร)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">Not set</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Street (ถนน/ซอย/ตรอก)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">Not set</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Sub-district (แขวง/ตำบล)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.address.subDistrict}
                        onChange={(e) => handleStoreDataChange('address.subDistrict', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.address.subDistrict || 'Not set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      District (เขต/อำเภอ)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.address.district}
                        onChange={(e) => handleStoreDataChange('address.district', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.address.district || 'Not set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Province (จังหวัด)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.address.province}
                        onChange={(e) => handleStoreDataChange('address.province', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.address.province || 'Not set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Country (ประเทศ)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue="ไทย"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">ไทย</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-d-grey-5 mb-2">
                      Postcode (รหัสไปรษณีย์)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={storeData.address.postcode}
                        onChange={(e) => handleStoreDataChange('address.postcode', e.target.value)}
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    ) : (
                      <div className="text-base text-d-grey-5">{storeData.address.postcode || 'Not set'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* File Upload Sections */}
              <div className="grid grid-cols-3 gap-8">
                <FileUploadSection 
                  title="Store Logo" 
                  subtitle="โลโก้ร้าน"
                  currentFile={storeData.logoUrl}
                />
                <FileUploadSection 
                  title="Stamp" 
                  subtitle="ตราประทับ"
                  currentFile={storeData.stampUrl}
                />
                <FileUploadSection 
                  title="Signature" 
                  subtitle="ลายเซ็น"
                  currentFile={storeData.signatureUrl}
                />
              </div>

              {/* Interest Preset Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-d-grey-5">Interest Preset</h3>
                    <span className="text-sm text-clay-grey">อัตราดอกเบี้ยตั้งต้น</span>
                  </div>
                  <div className="text-sm text-clay-grey">Maximum 6</div>
                </div>
                
                <div className="space-y-4">
                  {storeData.interestPresets.map((preset, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-l-grey-1 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-d-grey-5 mb-2">
                            Days
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={preset.days}
                              onChange={(e) => updateInterestPreset(index, 'days', parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            />
                          ) : (
                            <div className="text-base text-d-grey-5">{preset.days} days</div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-d-grey-5 mb-2">
                            Rate (%)
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              value={preset.rate}
                              onChange={(e) => updateInterestPreset(index, 'rate', parseFloat(e.target.value))}
                              className="w-full px-4 py-2 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                            />
                          ) : (
                            <div className="text-base text-d-grey-5">{preset.rate}%</div>
                          )}
                        </div>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeInterestPreset(index)}
                          className="p-2 text-semantic-red hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isEditing && storeData.interestPresets.length < 6 && (
                    <button
                      onClick={addInterestPreset}
                      className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-l-grey-3 rounded-lg text-clay-grey hover:border-leaf-green hover:text-leaf-green transition-colors"
                    >
                      <Plus size={16} />
                      Add Interest Preset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-leaf-green rounded-full flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-d-grey-5">{userData.fullName}</h2>
                  <p className="text-clay-grey">{userData.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.fullName}
                      onChange={(e) => handleUserDataChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    />
                  ) : (
                    <div className="text-base text-d-grey-5">{userData.fullName}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleUserDataChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    />
                  ) : (
                    <div className="text-base text-d-grey-5">{userData.email}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Role
                  </label>
                  <div className="text-base text-d-grey-5 capitalize">{userData.role}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}