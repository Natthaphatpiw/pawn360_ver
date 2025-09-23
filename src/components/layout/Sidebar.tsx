'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IoHome } from "react-icons/io5"
import { LuPackage } from "react-icons/lu";
import { AiFillFileText } from "react-icons/ai";
import { ImProfile } from "react-icons/im";
import { 
  LogOut,
  BarChart3,
  Users,
  CreditCard
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    icon: IoHome,
    href: '/dashboard',
    description: 'Overview and analytics'
  },
  {
    name: 'Pawn Entry',
    icon: LuPackage,
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('store');
    localStorage.removeItem('isAuthenticated');
    
    // Redirect to home page
    router.push('/');
  };

  return (
    <div className="bg-[#F5F4F2] border-r border-l-grey-2 w-[12.5rem] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-[1rem] border-b border-l-grey-2">
      <Link href="/dashboard" className="block">
        <Image 
          src="/images/Logo.avif" 
          alt="Pawn360 Logo" 
          width={130} 
          height={48} 
          className="mx-auto" 
        />
      </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-[1rem]">
        <div className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-full py-2 px-4 transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#c8e6c9] text-[#2e7d32] font-medium' // Style สำหรับ Active
                    : 'text-[#555] hover:bg-gray-200' // Style สำหรับ Inactive
                }`}
                style={{ minHeight: '44px', maxHeight: '44px' }}
              >
                {/* Icon Container */}
                <div className="relative flex-shrink-0" style={{ minWidth: '44px', maxWidth: '44px', minHeight: '44px', width: '44px' }}>
                  <div className={`flex items-center justify-center rounded w-8 h-8 m-2 ${
                    isActive ? 'bg-white/20' : 'bg-transparent'
                  }`}>
                    <Icon 
                      size={20} 
                      fill={isActive ? '#0E5D1E' : 'none'}
                      className={`${
                        isActive ? 'text-[#0E5D1E]' : 'text-[#9A9694]'
                      }`} 
                    />
                  </div>
                </div>
                
                {/* Text Container */}
                <div className="flex-1 min-w-0">
                  <h6 className={`text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
                    isActive ? 'text-[#0E5D1E]' : 'text-[#9A9694]'
                  }`}>
                    {item.name}
                  </h6>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-l-grey-2 p-4">
        {/* User Info */}
        <div className="mb-4 px-2">
          <div className="text-sm font-medium text-d-grey-5">John Doe</div>
          <div className="text-xs text-clay-grey">Admin • Gold Pawn Shop</div>
        </div>

        {/* Quick Stats */}
        <div className="bg-l-grey-1 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-clay-grey">Active Contracts</span>
            <span className="font-semibold text-leaf-green">24</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-clay-grey">Today's Value</span>
            <span className="font-semibold text-navy-blue">₿120K</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-clay-grey hover:text-semantic-red hover:bg-semantic-l-red rounded-lg transition-all duration-200 group"
        >
          <LogOut size={20} className="mr-3 group-hover:text-semantic-red" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}