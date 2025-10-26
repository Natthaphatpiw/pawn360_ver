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
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.store) {
            localStorage.setItem('store', JSON.stringify(data.store));
          }
        }

        // Show success message and redirect to dashboard
        alert('Account created successfully! Redirecting to dashboard...');

        // Redirect to dashboard
        router.push('/dashboard');
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
          <Link href="/" className="text-3xl font-bold text-leaf-green mb-4 inline-block">
            Pawn360
          </Link>
          <h2 className="text-3xl font-bold text-d-grey-5">Create Your Account</h2>
          <p className="mt-2 text-clay-grey">Join Pawn360 and start managing your pawn shop digitally</p>
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