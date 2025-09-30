'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { Poppins } from 'next/font/google';
import { IoHome } from "react-icons/io5";
import { PiPackageFill } from "react-icons/pi";
import { AiFillFileText } from "react-icons/ai";
import { ImProfile } from "react-icons/im";
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FixedLayoutProps {
  children: React.ReactNode;
}

const poppins = Poppins({
  weight: '400',
  subsets: ['latin'],
})

const menuItems = [
  {
    name: 'Dashboard',
    icon: IoHome,
    href: '/dashboard',
    description: 'Overview and analytics'
  },
  {
    name: 'Pawn Entry',
    icon: PiPackageFill,
    href: '/pawn-entry',
    description: 'Create new contracts'
  },
  {
    name: 'Contracts',
    icon: AiFillFileText,
    href: '/contracts',
    description: 'Manage all contracts'
  },
  {
    name: 'Account',
    icon: ImProfile,
    href: '/account',
    description: 'Store settings'
  }
];

export default function FixedLayout({ children }: FixedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/auth/signin');
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('store');
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-4">Pawn360</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100 flex flex-col">
      {/* Header */}
      {/* Top Header */}
      <header className="bg-[#F5F4F2] border-b border-l-grey-2 px-0 pt-[1.2rem] pb-[0.8rem]">
          <div className="flex items-center justify-between">
          
            {/* Left Side */}
            <div className="flex items-center gap-2 px-0">
            <div className="pr-[1.8rem] pl-[2.2rem]">
            <Link href="/dashboard" className="block">
              <Image 
                src="/images/Logo.avif" 
                alt="Pawn360 Logo" 
                width={130} 
                height={45} 
                className="mx-auto" 
              />
            </Link>
            </div>
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
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-clay-grey hover:text-leaf-green"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative text-clay-grey hover:text-leaf-green hover:bg-l-grey-1 rounded-lg transition-colors">
                <Bell size={20} />
              </button>

              {/* User Name */}
              <div className={`pr-8 text-[0.785rem] font-[500] whitespace-nowrap overflow-hidden text-ellipsis ${poppins.className} text-d-grey-5`}>
                Natthaphat
              </div>
            </div>
          </div>
        </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-[11rem]' : 'w-[0rem]'}`}>
            <div className={`
            fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:transform-none py-[0.4rem]
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden px-6 pb-[1.6rem]">
        <div className="bg-white rounded-[1.5rem] shadow-md h-full p-[1rem]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}