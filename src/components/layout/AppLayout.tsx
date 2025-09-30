'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Bell, Search, Menu, X } from 'lucide-react';
import { Poppins } from 'next/font/google';


const poppins = Poppins({
  weight: '400',
  subsets: ['latin'],
})
interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/auth/signin');
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-leaf-green mb-4">Pawn360</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leaf-green mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Get page title based on pathname
  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    switch (path) {
      case 'dashboard':
        return 'Dashboard';
      case 'pawn-entry':
        return 'Pawn Entry';
      case 'contracts':
        return 'Contracts';
      case 'account':
        return 'Account';
      default:
        return 'Pawn360';
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#F5F4F2] border-b border-l-grey-2 px-0 py-[1.1rem]">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-2 px-0">
            <div className="flex flex-col">
              <div className="text-xs text-gray-400 ${poppins.className}">
                Pages / {getPageTitle()}
              </div>
              <div className="text-[0.885rem] font-[500] ${poppins.className} text-d-grey-5 leading-[1.2rem] py-[0.185rem]">
                {getPageTitle()}
              </div>
            </div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-clay-grey hover:text-leaf-green"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-clay-grey hover:text-leaf-green hover:bg-l-grey-1 rounded-lg transition-colors">
                <Bell size={20} />
              </button>

              {/* User Name */}
              <div className={`px-8 text-[0.785rem] font-[500] whitespace-nowrap overflow-hidden text-ellipsis ${poppins.className} text-d-grey-5`}>
                Natthaphat
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm h-full p-6">
            {children}
          </div>
        </main>
        </div>
    </div>
  );
}