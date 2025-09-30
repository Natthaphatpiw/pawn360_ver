'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sarabun } from 'next/font/google';

const sarabun = Sarabun({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();

      // Store JWT token and user data
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.store) {
        localStorage.setItem('store', JSON.stringify(data.store));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${sarabun.className}`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Pawn Shop Management System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="รหัสผ่าน"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/auth/signup')}
                className="text-sm text-green-600 hover:text-green-500"
              >
                ยังไม่มีบัญชี? สมัครสมาชิก
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>ข้อมูลทดสอบ:</p>
              <p>Email: test@pawnshop.com</p>
              <p>Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}