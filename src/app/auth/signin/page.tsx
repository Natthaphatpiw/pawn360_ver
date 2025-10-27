'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call Next.js API routes
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.store) {
          localStorage.setItem('store', JSON.stringify(data.store));
        }
        if (data.stores) {
          localStorage.setItem('stores', JSON.stringify(data.stores));
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Sign in failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-4xl font-bold text-leaf-green mb-6 inline-block">
            Pawn360
          </Link>
          <h2 className="text-3xl font-bold text-d-grey-5">Welcome Back</h2>
          <p className="mt-2 text-clay-grey">Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-semantic-l-red border border-semantic-red text-semantic-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-clay-grey mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pl-12 border border-l-grey-4 rounded-lg form-input"
                  placeholder="Enter your email"
                />
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-clay-grey" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-clay-grey mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pl-12 pr-12 border border-l-grey-4 rounded-lg form-input"
                  placeholder="Enter your password"
                />
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-clay-grey" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-clay-grey hover:text-leaf-green"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-leaf-green focus:ring-leaf-green border-l-grey-4 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-clay-grey">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-leaf-green hover:text-green-600">
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-leaf-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-l-grey-1 rounded-lg">
            <p className="text-sm text-clay-grey text-center mb-2">Demo Credentials (for testing):</p>
            <div className="text-xs text-clay-grey text-center space-y-1">
              <p>Email: demo@pawn360.com</p>
              <p>Password: demo123</p>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-clay-grey">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-leaf-green hover:text-green-600 font-semibold">
                Sign Up
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

        {/* Features Preview */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-d-grey-5 mb-4 text-center">Why Choose Pawn360?</h3>
          <div className="space-y-3 text-sm text-clay-grey">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-leaf-green rounded-full"></div>
              <span>Complete pawn shop management system</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-leaf-green rounded-full"></div>
              <span>AI-powered item valuation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-leaf-green rounded-full"></div>
              <span>Secure cloud storage</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-leaf-green rounded-full"></div>
              <span>Real-time analytics and reporting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}