'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Building, MapPin, Phone, CreditCard, Plus, Trash2, Percent, Calendar } from 'lucide-react';
import InterestPresetSettings from '@/components/settings/InterestPresetSettings';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // User Information
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Store Information
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
    ] as Array<{days: number, rate: number}>,
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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUploading, setQrCodeUploading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('delayed.')) {
      const delayedField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        delayed: {
          ...prev.delayed,
          [delayedField]: name.includes('maxday') ? parseInt(value) || 0 : parseFloat(value) || 0
        }
      }));
    } else if (name === 'interestPerday') {
      setFormData(prev => ({
        ...prev,
        interestPerday: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleInterestPresetsChange = (presets: Array<{days: number, rate: number}>) => {
    setFormData(prev => ({
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
      setFormData(prev => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      // API call to signup endpoint using Next.js API routes
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: 'admin'
          },
          store: {
            store_name: formData.storeName,
            address: formData.address,
            phone: formData.phone,
            tax_id: formData.taxId,
            googlemap: formData.googlemap,
            bankUrl: formData.bankUrl,
            interestPerday: formData.interestPerday,
            interestSet: formData.interestSet,
            interestPresets: formData.interestPresets,
            contractTemplate: formData.contractTemplate,
            delayed: formData.delayed
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token if provided
        if (data.access_token) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('access_token', data.access_token); // Also store as access_token for consistency
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.store) {
            localStorage.setItem('store', JSON.stringify(data.store));
          }
          if (data.stores) {
            localStorage.setItem('stores', JSON.stringify(data.stores));
          }
        }

        // Show success message and redirect to dashboard
        alert('Account created successfully! Redirecting to dashboard...');

        // Small delay to ensure localStorage is fully written
        setTimeout(() => {
          // Redirect to dashboard
          router.push('/dashboard');
        }, 100);
      } else {
        setError(data.error || data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Signup error:', err);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <a href="/" className="text-3xl font-bold text-leaf-green mb-4 inline-block cursor-pointer">
            Pawn360
          </a>
          <h2 className="text-3xl font-bold text-d-grey-5">Create Your Account</h2>
          <p className="mt-2 text-clay-grey">Join Pawn360 and start managing your pawn shop digitally</p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="/" className="text-leaf-green hover:text-green-600 text-sm font-medium">
              ← กลับไปหน้าแรก
            </a>
            <a href="/auth/login" className="text-leaf-green hover:text-green-600 text-sm font-medium">
              เข้าสู่ระบบ
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-semantic-l-red border border-semantic-red text-semantic-red px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* User Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-d-grey-5 flex items-center gap-2">
                <User size={20} className="text-leaf-green" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Password*
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Confirm Password*
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            {/* Store Information Section */}
            <div className="space-y-4 border-t border-l-grey-2 pt-6">
              <h3 className="text-lg font-semibold text-d-grey-5 flex items-center gap-2">
                <Building size={20} className="text-leaf-green" />
                Store Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Store Name*
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter store name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-clay-grey mb-1">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Tax ID
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  placeholder="Enter tax identification number"
                />
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  name="googlemap"
                  value={formData.googlemap}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              {/* Interest Per Day */}
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Daily Interest Rate (%)
                </label>
                <input
                  type="number"
                  name="interestPerday"
                  value={formData.interestPerday}
                  onChange={handleInputChange}
                  step="0.001"
                  min="0"
                  max="1"
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  placeholder="0.025"
                />
              </div>

              {/* Max Late Days */}
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Maximum Late Days
                </label>
                <input
                  type="number"
                  name="delayed.maxday"
                  value={formData.delayed.maxday}
                  onChange={handleInputChange}
                  min="0"
                  max="365"
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  placeholder="7"
                />
              </div>

              {/* Late Fee Per Day */}
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Late Fee Per Day (฿)
                </label>
                <input
                  type="number"
                  name="delayed.feeperday"
                  value={formData.delayed.feeperday}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  placeholder="100"
                />
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-1">
                  Bank QR Code (Optional)
                </label>
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
                  interestPresets={formData.interestPresets}
                  onInterestPresetsChange={handleInterestPresetsChange}
                />
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-clay-grey flex items-center gap-2">
                  <MapPin size={16} className="text-leaf-green" />
                  Store Address
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.houseNumber"
                    value={formData.address.houseNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="House Number"
                  />
                  <input
                    type="text"
                    name="address.village"
                    value={formData.address.village}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Village"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.subDistrict"
                    value={formData.address.subDistrict}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Sub-district"
                  />
                  <input
                    type="text"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="District"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="address.province"
                    value={formData.address.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Province"
                  />
                  <input
                    type="text"
                    name="address.postcode"
                    value={formData.address.postcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Postcode"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input bg-gray-50"
                    placeholder="Country"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-leaf-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-clay-grey">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-leaf-green hover:text-green-600 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-clay-grey hover:text-leaf-green transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}