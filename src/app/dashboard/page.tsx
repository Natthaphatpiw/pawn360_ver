'use client';

import React, { useState, useEffect } from 'react';
// Make sure to adjust the import path if your FixedLayout is elsewhere
import FixedLayout from '@/components/layout/FixedLayout';
import CurrentItemsChart from '@/components/charts/CurrentItemsChart';
import SuspendedItemsChart, { suspendedItemsData } from '@/components/charts/SuspendedItemsChart';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Sarabun } from 'next/font/google'

const prompt = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'] // แนะนำให้ import หลายน้ำหนัก
})

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date(); // Current date (today is September 25, 2025)
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); // Current month
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTodayDropdown, setShowTodayDropdown] = useState(false);
  const [isDueSoonExpanded, setIsDueSoonExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isSuspendedExpanded, setIsSuspendedExpanded] = useState(false);

  // Sorting states
  const [dueSoonSort, setDueSoonSort] = useState({ field: '', order: 'default' });
  const [overdueSort, setOverdueSort] = useState({ field: '', order: 'default' });
  const [suspendedSort, setSuspendedSort] = useState({ field: '', order: 'default' });

  // Mock data for contracts due soon
  const contractsDueSoon = [
    {
      contractNo: 'C2025-001',
      value: 15000,
      dueDate: '2025-09-26',
      customerName: 'นายสมชาย ใจดี'
    },
    {
      contractNo: 'C2025-002', 
      value: 8500,
      dueDate: '2025-09-25',
      customerName: 'นางสาวมาลัย รักดี'
    },
    {
      contractNo: 'C2025-003',
      value: 22000,
      dueDate: '2025-09-27',
      customerName: 'นายประเสริฐ มั่งมี'
    }
  ];

  // Mock data for overdue contracts
  const contractsOverdue = [
    {
      contractNo: 'C2025-004',
      value: 12000,
      dueDate: '2025-09-18',
      customerName: 'นายวิชัย เก่งกาจ'
    },
    {
      contractNo: 'C2025-005',
      value: 25000,
      dueDate: '2025-09-16',
      customerName: 'นางสาวสุดา ขยันดี'
    },
    {
      contractNo: 'C2025-006',
      value: 18500,
      dueDate: '2025-09-19',
      customerName: 'นายอานนท์ มีเงิน'
    },
    {
      contractNo: 'C2025-007',
      value: 9800,
      dueDate: '2025-09-17',
      customerName: 'นางจิราพร สวยงาม'
    },
    {
      contractNo: 'C2025-008',
      value: 7200,
      dueDate: '2025-09-20',
      customerName: 'นายสมบัติ รำ่รวย'
    },
    {
      contractNo: 'C2025-009',
      value: 16300,
      dueDate: '2025-09-15',
      customerName: 'นางสาวปิยะดา นุ่มนิ่ม'
    },
    {
      contractNo: 'C2025-010',
      value: 11200,
      dueDate: '2025-09-21',
      customerName: 'นายธนากร โชคดี'
    }
  ];

  // Mock data for suspended contracts
  const contractsSuspended = [
    {
      contractNo: 'C2025-011',
      value: 30000,
      dueDate: '2025-08-15',
      customerName: 'นายสุรชัย ล้มละลาย'
    },
    {
      contractNo: 'C2025-012',
      value: 45000,
      dueDate: '2025-08-10',
      customerName: 'นางสาวพิมพ์ใจ หนี้สิน'
    },
    {
      contractNo: 'C2025-013',
      value: 28500,
      dueDate: '2025-08-22',
      customerName: 'นายบุญชัย หายไป'
    }
  ];

  // Sorting functions
  const handleSort = (section: 'dueSoon' | 'overdue' | 'suspended', field: string) => {
    const currentSort = section === 'dueSoon' ? dueSoonSort : 
                       section === 'overdue' ? overdueSort : suspendedSort;
    
    let newOrder = 'asc';
    if (currentSort.field === field) {
      if (currentSort.order === 'asc') newOrder = 'desc';
      else if (currentSort.order === 'desc') newOrder = 'default';
      else newOrder = 'asc';
    }

    const newSort = { field, order: newOrder };
    
    if (section === 'dueSoon') setDueSoonSort(newSort);
    else if (section === 'overdue') setOverdueSort(newSort);
    else setSuspendedSort(newSort);
  };

  const sortContracts = (contracts: any[], sortState: any) => {
    if (sortState.order === 'default') return contracts;

    return [...contracts].sort((a, b) => {
      let aValue = a[sortState.field];
      let bValue = b[sortState.field];

      // Convert to numbers for value field
      if (sortState.field === 'value') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortState.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Get sorted data
  const sortedDueSoon = sortContracts(contractsDueSoon, dueSoonSort);
  const sortedOverdue = sortContracts(contractsOverdue, overdueSort);
  const sortedSuspended = sortContracts(contractsSuspended, suspendedSort);

  // Sort button component
  const SortButton = ({ field, section, currentSort }: { field: string, section: 'dueSoon' | 'overdue' | 'suspended', currentSort: any }) => {
    const isActive = currentSort.field === field;
    const order = isActive ? currentSort.order : 'default';
    
    return (
      <button
        onClick={() => handleSort(section, field)}
        className="ml-1 p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
      >
        {order === 'asc' ? (
          <ChevronUp size={12} className="text-blue-500" />
        ) : order === 'desc' ? (
          <ChevronDown size={12} className="text-blue-500" />
        ) : (
          <div className="flex flex-col">
            <ChevronUp size={8} className="text-gray-300 -mb-1" />
            <ChevronDown size={8} className="text-gray-300" />
          </div>
        )}
      </button>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleQuickNavigation = (option: string) => {
    console.log('Quick navigation clicked:', option);
    let newDate = new Date(today);
    
    switch (option) {
      case '7-days-before':
        newDate.setDate(today.getDate() - 7);
        break;
      case '7-days-after':
        newDate.setDate(today.getDate() + 7);
        break;
      case '1-month-after':
        newDate.setMonth(today.getMonth() + 1);
        break;
      case '3-months-after':
        newDate.setMonth(today.getMonth() + 3);
        break;
      case 'today':
        newDate = new Date(today);
        break;
      default:
        newDate = new Date(today);
        break;
    }
    
    console.log('Today:', today);
    console.log('New date:', newDate);
    console.log('Setting currentDate to:', new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    
    setSelectedDate(new Date(newDate));
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    setShowTodayDropdown(false);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showTodayDropdown) {
        setShowTodayDropdown(false);
      }
    };

    if (showTodayDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTodayDropdown]);

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-start-${i}`} className="text-center p-1 text-xs"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDateObj = new Date(year, month, day);
      const isToday = isSameDate(currentDateObj, today);
      const isSelected = selectedDate && isSameDate(currentDateObj, selectedDate);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(currentDateObj)}
          className={`text-center p-1.5 text-xs rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center w-6 h-6 ${
            isToday ? 'bg-gray-800 text-white font-medium' : 
            isSelected ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-700'
          }`}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-y-2 place-items-center">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-medium text-xs text-gray-500 p-1 w-6">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };
  
  // A small component for the title badges to avoid repetition
  const TitleBadge = ({ text }: { text: string }) => (
    <div className="bg-gray-100 text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md">
      {text}
    </div>
  );

  return (
    <FixedLayout>
    <div className={`flex h-full gap-1 ${prompt.className}`}>
      <div className="w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
        {/* Top Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-gray-800 text-[18px] ">Foreclosed item value</h2>
            <TitleBadge text="มูลค่าของหลุดจำนำ" />
          </div>
        </div>
        {/* Top Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
          {/* Card 1: Awaiting sale */}
          <div className="bg-[#B4CDB9] rounded-2xl p-4 border border-green-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Awaiting sale</h3>
              <p className="text-sm text-green-700">มูลค่ารอขาย</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-700">THB</p>
              <p className="text-2xl font-medium text-green-800">-</p>
            </div>
          </div>
          {/* Card 2: Sold */}
          <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sold</h3>
              <p className="text-sm text-gray-600">มูลค่าขายแล้ว</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">THB</p>
              <p className="text-2xl font-medium text-gray-800">7,000.00</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-gray-800 text-[18px]">Item categories</h2>
            <TitleBadge text="ประเภทสินค้า" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
          {/* Left Column */}
            <div className="bg-[#F0EFEF] rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-[14px] font-semibold text-gray-700">Current items</h4>
                <div className="bg-gray-100 text-[10px] text-gray-500 px-1.5 py-0.5 rounded-md">สัดส่วนสินค้าปัจจุบัน</div>
              </div>
              <div className="bg-[#ffffff] rounded-xl p-4 flex gap-4 items-center">
                <div className="w-28 h-28 flex-shrink-0">
                  <CurrentItemsChart />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span><span>Laptop (36%)</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span><span>Phone (50%)</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span><span>Handheld Gaming PC (14%)</span></div>
                </div>
              </div>
            </div>
            <div className="bg-[#F0EFEF] rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[14px] font-semibold text-gray-700">Suspended items</h4>
                    <div className="bg-gray-100 text-[10px] text-gray-500 px-1.5 py-0.5 rounded-md">สัดส่วนสินค้าที่หลุดจำนำ</div>
                </div>
                <div className="bg-[#ffffff] rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-28 h-28 flex-shrink-0">
                    <SuspendedItemsChart />
                  </div>
                  <div className="space-y-2 text-xs">
                    {suspendedItemsData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span>{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
        </div>
        {/* Bottom Contracts Section */}
        
          <div className="bg-[#FFF4E5] rounded-2xl p-3 border border-[#FEC97C]">
            <div className="grid grid-cols-1 md:grid-cols-3 flex-shrink-0 justify-between items-center cursor-pointer" onClick={() => setIsDueSoonExpanded(!isDueSoonExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Contracts due soon(D+3)</h3>
                    <p className="text-xs text-gray-600 font-light">สัญญากำลังจะถึงกำหนดในอีก 3 วัน</p>
                </div>
                <div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 flex items-center gap-3 sm:gap-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500">Number</p>
                        <p className="font-medium text-gray-800 text-[18px]">{contractsDueSoon.length}</p>
                    </div>
                    <div className="w-px h-10 bg-[#FEC97C]"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 flex justify-end">THB</p>
                        <p className="font-medium text-gray-800 text-[18px] flex justify-end">{contractsDueSoon.reduce((sum, contract) => sum + contract.value, 0).toLocaleString()}.00</p>
                    </div>
                </div>
            </div>
            {isDueSoonExpanded && (
              <div className="border-t border-[#FEC97C] mt-3 pt-2">
                <div className="grid grid-cols-3 text-xs text-gray-500 px-2 mb-2">
                  <div className="font-medium flex items-center">
                    Contract no.
                    <SortButton field="contractNo" section="dueSoon" currentSort={dueSoonSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Value
                    <SortButton field="value" section="dueSoon" currentSort={dueSoonSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Due date
                    <SortButton field="dueDate" section="dueSoon" currentSort={dueSoonSort} />
                  </div>
                </div>
                <div className="bg-[#F9F9F9] border border-[#FEC97C] rounded-xl space-y-1 max-h-56 overflow-y-auto">
                  {sortedDueSoon.map((contract, index) => (
                    <div key={index} className={`grid grid-cols-3 text-xs px-2 py-2 rounded ${prompt.className}`}>
                      <div className="font-medium text-gray-700">{contract.contractNo}</div>
                      <div className="text-gray-700">{contract.value.toLocaleString()} THB</div>
                      <div className="text-gray-700">{contract.dueDate}</div>
                      <div className="col-span-3 text-gray-600 text-[11px] mt-1">{contract.customerName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-green-50 rounded-2xl p-3 border border-[#96C996]">
            <div className="grid grid-cols-1 md:grid-cols-3 flex-shrink-0 justify-between items-center cursor-pointer" onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Overdue contracts(D-7)</h3>
                    <p className="text-xs text-gray-600 font-light">สัญญาที่ขาดกำหนดเกินกำหนดมาไม่เกิน 7 วัน</p>
                </div>
                <div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 flex items-center gap-3 sm:gap-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500">Number</p>
                        <p className="font-medium text-gray-800 text-[18px]">{contractsOverdue.length}</p>
                    </div>
                    <div className="w-px h-10 bg-[#96C996]"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 flex justify-end">THB</p>
                        <p className="font-medium text-gray-800 text-[18px] text-right flex justify-end">{contractsOverdue.reduce((sum, contract) => sum + contract.value, 0).toLocaleString()}.00</p>
                    </div>
                </div>
            </div>
            {isOverdueExpanded && (
              <div className="border-t border-[#96C996] mt-3 pt-2">
                <div className="grid grid-cols-3 text-xs text-gray-500 px-2 mb-2">
                  <div className="font-medium flex items-center">
                    Contract no.
                    <SortButton field="contractNo" section="overdue" currentSort={overdueSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Value
                    <SortButton field="value" section="overdue" currentSort={overdueSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Due date
                    <SortButton field="dueDate" section="overdue" currentSort={overdueSort} />
                  </div>
                </div>
                <div className="bg-[#F9F9F9] border border-[#96C996] rounded-xl space-y-1 max-h-56 overflow-y-auto">
                  {sortedOverdue.map((contract, index) => (
                    <div key={index} className={`grid grid-cols-3 text-xs px-2 py-2 rounded ${prompt.className}`}>
                      <div className="font-medium text-gray-700">{contract.contractNo}</div>
                      <div className="text-gray-700">{contract.value.toLocaleString()} THB</div>
                      <div className="text-gray-700">{contract.dueDate}</div>
                      <div className="col-span-3 text-gray-600 text-[11px] mt-1">{contract.customerName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-red-50 rounded-2xl p-3 border border-[#F19DA2]">
            <div className="grid grid-cols-1 md:grid-cols-3 flex-shrink-0 justify-between items-center cursor-pointer" onClick={() => setIsSuspendedExpanded(!isSuspendedExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Suspended contracts</h3>
                    <p className="text-xs text-gray-600 font-light">สถานะกำลังจะหลุดจำนำ</p>
                </div>
                <div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 flex items-center gap-3 sm:gap-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500">Number</p>
                        <p className="font-medium text-gray-800 text-[18px]">{contractsSuspended.length}</p>
                    </div>
                    <div className="w-px h-10 bg-[#F19DA2]"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 flex justify-end">THB</p>
                        <p className="font-medium text-gray-800 text-[18px] text-right flex justify-end">{contractsSuspended.reduce((sum, contract) => sum + contract.value, 0).toLocaleString()}.00</p>
                    </div>
                </div>
            </div>
            {isSuspendedExpanded && (
              <div className="border-t border-[#F19DA2] mt-3 pt-2">
                <div className="grid grid-cols-3 text-xs text-gray-500 px-2 mb-2">
                  <div className="font-medium flex items-center">
                    Contract no.
                    <SortButton field="contractNo" section="suspended" currentSort={suspendedSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Value
                    <SortButton field="value" section="suspended" currentSort={suspendedSort} />
                  </div>
                  <div className="font-medium flex items-center">
                    Due date
                    <SortButton field="dueDate" section="suspended" currentSort={suspendedSort} />
                  </div>
                </div>
                <div className="bg-[#F9F9F9] border border-[#F19DA2] rounded-xl space-y-1 max-h-56 overflow-y-auto">
                  {sortedSuspended.map((contract, index) => (
                    <div key={index} className={`grid grid-cols-3 text-xs px-2 py-2 rounded ${prompt.className}`}>
                      <div className="font-medium text-gray-700">{contract.contractNo}</div>
                      <div className="text-gray-700">{contract.value.toLocaleString()} THB</div>
                      <div className="text-gray-700">{contract.dueDate}</div>
                      <div className="col-span-3 text-gray-600 text-[11px] mt-1">{contract.customerName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>
      <div className="w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-gray-800 text-[18px]">Pawned property value</h2>
            <TitleBadge text="มูลค่าทรัพย์สินจำนำรวม" />
          </div>
        </div>
        {/* Top Card Section */}
        <div className="bg-[#0A4215] text-[#F5F4F2] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">Today Value</p>
            <p className="text-sm opacity-80">มูลค่ารวม</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">THB</p>
            <p className="text-2xl text-right flex justify-end">77,300.00</p>
          </div>
        </div>
          <div className="flex flex-col gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <button 
                        onClick={() => setShowTodayDropdown(!showTodayDropdown)}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-100 text-[11px] font-medium text-gray-600"
                      >
                        today
                      </button>
                      {showTodayDropdown && (
                        <div 
                          className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickNavigation('today');
                            }}
                            className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                          >
                            Today
                          </button>
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickNavigation('7-days-before');
                            }}
                            className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            7 days before
                          </button>
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickNavigation('7-days-after');
                            }}
                            className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            7 days after
                          </button>
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickNavigation('1-month-after');
                            }}
                            className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100"
                          >
                            1 month after
                          </button>
                          <button 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickNavigation('3-months-after');
                            }}
                            className="block w-full text-left px-3 py-2 text-[11px] text-gray-700 hover:bg-gray-100 last:rounded-b-md"
                          >
                            3 months after
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => navigateMonth('prev')} className="p-1.5 hover:bg-gray-100 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => navigateMonth('next')} className="p-1.5 hover:bg-gray-100 rounded-md"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                {renderCalendar()}
              </div>
                <div className="flex items-center">
                  <h3 className="text-[18px] font-medium text-gray-700">Average contract duration</h3>
                  <TitleBadge text="อายุสัญญาเฉลี่ย" />
                </div>
                <div className="space-y-3">
                  <div className="bg-[#F5F4F2] rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-700">Before redemption</p>
                      <p className="text-xs text-gray-500">ก่อนไถ่ถอน</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">month(s)</p>
                      <p className="text-[18px] font-medium text-gray-800">0.0</p>
                    </div>
                  </div>
                  <div className="bg-[#F5F4F2] rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-700">Before the suspended</p>
                      <p className="text-xs text-gray-500">ก่อนจะหลุดจำนำ</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">month(s)</p>
                      <p className="text-[18px] font-medium text-gray-800">0.0</p>
                    </div>
                  </div>
                </div>
          </div>
          <button
            onClick={() => router.push('/pawn-entry')}
            className="w-full bg-[#386337] text-[#F5F4F2] py-7 rounded-2xl hover:bg-[#0A4215] hover:text-white transition-colors flex items-center justify-center font-semibold"
          >
            <Plus className="w-6 h-6" />
            <span className="text-[18px] font-medium">New contract</span>
          </button>
      </div>
    </div>
    </FixedLayout>
  );
}