'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Data for the pie chart - matching exact colors from screenshot
const currentItemsData = [
  { name: 'Handheld Gaming PC', value: 35, color: '#3B82F6' }, // Blue
  { name: 'Laptop', value: 30, color: '#EF4444' }, // Red
  { name: 'Streaming Device', value: 20, color: '#F97316' }, // Orange
  { name: 'Tablet', value: 15, color: '#10B981' } // Green
];


export default function DashboardPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 8, 23)); // Set to Sep 23, 2025

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date(2025, 8, 23).getDate();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="text-center p-1 text-xs"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today && month === 8 && year === 2025;
      days.push(
        <div
          key={day}
          className={`text-center p-1 text-xs rounded ${
            isToday ? 'bg-gray-800 text-white font-medium' : 'text-gray-700'
          }`}
        >
          {day}
        </div>
      );
    }

    // Handle days from previous/next month for a complete grid
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length - firstDayOfMonth;
    
    // Get last day of the previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const emptyStartWithPrevDays = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        emptyStartWithPrevDays.push(
            <div key={`prev-month-day-${i}`} className="text-center p-1 text-xs text-gray-400">
                {prevMonthLastDay - i}
            </div>
        );
    }
    
    const nextMonthDays = [];
    for (let i = 1; i <= remainingCells; i++) {
        nextMonthDays.push(
            <div key={`next-month-day-${i}`} className="text-center p-1 text-xs text-gray-400">
                {i}
            </div>
        );
    }


    return (
      <div className="grid grid-cols-7 gap-0">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-medium text-xs text-gray-500 p-1">
            {day}
          </div>
        ))}
        {emptyStartWithPrevDays}
        {days}
        {nextMonthDays.slice(0, totalCells - (emptyStartWithPrevDays.length + days.length))}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); // Set to the first day to avoid issues with month lengths
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pages / Dashboard</p>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Natthaphat</span>
            <div className="w-8 h-8 rounded-full bg-gray-300"></div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left section */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* Foreclosed item value */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Foreclosed item value <span className="text-xs font-normal text-gray-400 ml-2">มูลค่าของหลุดจำนำ</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#C6F6D5] rounded-lg p-4">
                  <div className="mb-4">
                    <p className="text-gray-700 font-semibold">Awaiting sale</p>
                    <p className="text-xs text-gray-500">มูลค่ารอขาย</p>
                  </div>
                  <p className="text-right text-xs text-gray-500 font-medium">THB</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="mb-4">
                    <p className="text-gray-700 font-semibold">Sold</p>
                    <p className="text-xs text-gray-500">มูลค่าขายแล้ว</p>
                  </div>
                  <p className="text-right text-2xl font-bold text-gray-800">7,000.00</p>
                </div>
              </div>
            </div>

            {/* Item categories & Suspended items */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Item categories <span className="text-xs font-normal text-gray-400 ml-2">ประเภทสินค้า</span></h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Current Items <span className="text-xs font-normal text-gray-400 ml-2">สัดส่วนสินค้าปัจจุบัน</span></h3>
                  <div className="flex items-center justify-center">
                    <div style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie 
                            data={currentItemsData} 
                            dataKey="value" 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={2}
                          >
                            {currentItemsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-gray-500"></span>
                      </div>
                    </div>
                    <div className="ml-4 space-y-1">
                      {currentItemsData.map(item => (
                         <div key={item.name} className="flex items-center">
                           <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                           <span className="text-xs text-gray-700">{item.name}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Suspended Items <span className="text-xs font-normal text-gray-400 ml-2">สัดส่วนสินค้าที่หลุดจำนำ</span></h3>
                  <div className="flex items-center justify-center h-32">
                    <p className="text-gray-400 text-xs">ไม่มีข้อมูล</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contracts due soon */}
            <div className="bg-[#FEF3C7] rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Contracts due soon(D+3)</h3>
                        <p className="text-xs text-gray-600">สัญญาที่จะครบกำหนดในอีก 3 วัน</p>
                    </div>
                    <div className="text-right">
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-gray-500 mb-1">Number</p>
                          <p className="text-2xl font-bold text-gray-800">0</p>
                          <p className="text-xs text-gray-500 mt-1">THB</p>
                        </div>
                    </div>
                </div>
                <div className="border-t border-yellow-300 pt-2">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs text-gray-600">
                                <th className="text-left font-normal py-1">Contract no.</th>
                                <th className="text-left font-normal py-1">Value</th>
                                <th className="text-left font-normal py-1">Due date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colSpan={3} className="py-2"></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Overdue contracts */}
            <div className="bg-[#D1FAE5] rounded-lg p-4">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Overdue contracts(D-7)</h3>
                        <p className="text-xs text-gray-600">สัญญาค้างชำระ (เลยกำหนดไม่เกิน 7 วัน)</p>
                    </div>
                    <div className="flex items-start space-x-6">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Number</p>
                            <p className="text-2xl font-bold text-gray-800">7</p>
                        </div>
                        <div className="border-l border-gray-300 h-12"></div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1 invisible">THB</p>
                            <p className="text-2xl font-bold text-gray-800">77,300.00</p>
                            <p className="text-xs text-gray-500">THB</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suspended contracts */}
            <div className="bg-[#FEE2E2] rounded-lg p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Suspended contracts</h3>
                        <p className="text-xs text-gray-600">สัญญาที่สิ้นสุดไปแล้ว</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Number</p>
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500 mt-1">THB</p>
                    </div>
                </div>
            </div>

          </div>

          {/* Right section */}
          <div className="col-span-12 lg:col-span-4 space-y-4">

            {/* Pawned property value */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Pawned property value <span className="text-xs font-normal text-gray-400 ml-2">มูลค่าทรัพย์สินจำนำรวม</span></h2>
              <div className="bg-[#14532D] text-white rounded-lg p-4">
                  <div className="mb-4">
                      <p className="font-semibold">Today Value</p>
                      <p className="text-xs opacity-80">มูลค่ารวม</p>
                  </div>
                  <div className="text-right">
                      <p className="text-3xl font-bold">77,300.00</p>
                  </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-1">
                    <button className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">today</button>
                    <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRight size={16} />
                    </button>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              {renderCalendar()}
            </div>
            
            {/* Average contract duration */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Average contract duration <span className="text-xs font-normal text-gray-400 ml-2">อายุสัญญาเฉลี่ย</span></h2>
                <div className="space-y-3">
                    <div className="bg-[#E6F4EA] rounded-lg p-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-[#059669]">Before redemption</p>
                                <p className="text-xs text-gray-600">ก่อนไถ่ถอน</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-gray-800">0.0</div>
                                <div className="text-xs text-gray-500">month(s)</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Before the suspended</p>
                                <p className="text-xs text-gray-600">ก่อนหลุดจำนำ</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-gray-800">0.0</div>
                                <div className="text-xs text-gray-500">month(s)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* New Contract Button */}
            <button
              onClick={() => router.push('/pawn-entry')}
              className="w-full bg-[#14532D] text-white py-3 rounded-lg flex items-center justify-center font-medium hover:bg-green-900 transition-colors"
            >
              <Plus size={18} className="mr-2" />
              New contract
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}