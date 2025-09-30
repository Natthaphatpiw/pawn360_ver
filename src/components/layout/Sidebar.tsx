'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IoHome } from "react-icons/io5"
import { PiPackageFill } from "react-icons/pi";
import { AiFillFileText } from "react-icons/ai";
import { ImProfile } from "react-icons/im";
import { 
  LogOut,
  BarChart3,
  Users,
  CreditCard
} from 'lucide-react';
import { Poppins } from 'next/font/google';

const inter = Poppins({
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
      

      {/* Navigation Menu */}
      <nav className="flex-1 py-[1rem]">
        <div className="space-y-2 px-5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl py-2 px-1 transition-colors duration-200 ${
                  isActive
                    ? 'bg-[#B4CDB9] text-[#B4CDB9] font-medium hover:text-[#0E5D1E] hover:bg-[#5E9268]' // Style สำหรับ Active
                    : 'text-[#555] hover:text-[#0E5D1E] hover:bg-[#C8D6C9]' // Style สำหรับ Inactive
                }`}
                style={{ minHeight: '44px', maxHeight: '44px' }}
              >
                {/* Icon Container */}
                <div className="relative flex-shrink-0" style={{ minWidth: '44px', maxWidth: '44px', minHeight: '44px', width: '44px' }}>
                  <div className={`flex items-center justify-center rounded w-8 h-8 m-2`}>
                    <Icon 
                      size={20} 
                      className={`${
                        isActive ? 'text-[#0E5D1E]' : 'text-[#9A9694]'
                      }`} 
                    />
                  </div>
                </div>
                
                {/* Text Container */}
                <div className="flex-1 min-w-0">
                  <h6 className={`text-[0.785rem] font-[500] whitespace-nowrap overflow-hidden text-ellipsis ${inter.className} ${
                    isActive ? 'text-[#0E5D1E] hover:text-[#0A4215]' : 'text-[#9A9694] hover:text-[#5E9268]'
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-clay-grey hover:text-semantic-red hover:bg-semantic-l-red rounded-lg transition-all duration-200 group ${inter.className}"
        >
          <LogOut size={20} className="mr-3 group-hover:text-semantic-red" />
          <span className="text-[0.785rem] font-[500] whitespace-nowrap overflow-hidden text-ellipsis ${inter.className} text-clay-grey">Logout</span>
        </button>

        {/* Quick Stats */}
        <div className="bg-l-grey-1 rounded-lg p-3 mb-4 ${inter.className}">
          <div className="flex justify-between items-center text-xs">
            <span className="text-clay-grey"></span>
            <span className="font-semibold text-leaf-green"></span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-clay-grey"></span>
            <span className="font-semibold text-navy-blue"></span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-clay-grey hover:text-semantic-red hover:bg-semantic-l-red rounded-lg transition-all duration-200 group ${inter.className}"
        >
          <LogOut size={20} className="mr-3 group-hover:text-semantic-red" />
          <span className="text-[0.785rem] font-[500] whitespace-nowrap overflow-hidden text-ellipsis ${inter.className} text-clay-grey">Logout</span>
        </button>
      </div>
    </div>
  );
}