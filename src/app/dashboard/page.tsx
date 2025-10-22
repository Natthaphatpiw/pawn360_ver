'use client';

import React, { useState, useEffect } from 'react';
// Make sure to adjust the import path if your FixedLayout is elsewhere
import FixedLayout from '@/components/layout/FixedLayout';
import CurrentItemsChart from '@/components/charts/CurrentItemsChart';
import SuspendedItemsChart, { getSuspendedItemsData } from '@/components/charts/SuspendedItemsChart';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Calendar
} from 'lucide-react';
import { Sarabun } from 'next/font/google'

const prompt = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'] // แนะนำให้ import หลายน้ำหนัก
})

interface Contract {
  _id: string;
  contractNumber: string;
  customerId: string;
  customer: {
    fullName: string;
    phone: string;
    idNumber: string;
  };
  pawnDetails: {
    pawnedPrice: number;
    interestRate: number;
    totalInterest: number;
    remainingAmount: number;
    payInterest?: number;
    fineAmount?: number;
    soldAmount?: number;
  };
  item: {
    brand: string;
    model: string;
    type: string;
    serialNumber: string;
    description: string;
    images: string[];
  };
  dates: {
    contractDate: string;
    dueDate: string;
    redeemDate?: string;
    suspendedDate?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date(); // Current date (today is September 25, 2025)
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); // Current month
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showTodayDropdown, setShowTodayDropdown] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [isDueSoonExpanded, setIsDueSoonExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isSuspendedExpanded, setIsSuspendedExpanded] = useState(false);

  // Real data states
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStores, setUserStores] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Sorting states
  const [dueSoonSort, setDueSoonSort] = useState({ field: '', order: 'default' });
  const [overdueSort, setOverdueSort] = useState({ field: '', order: 'default' });
  const [suspendedSort, setSuspendedSort] = useState({ field: '', order: 'default' });

  // Fetch user stores and contracts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');

        if (!userStr || !token) {
          router.push('/auth/login');
          return;
        }

        // Fetch user's stores
        const storesResponse = await fetch('http://40.81.244.202:8000/stores', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (storesResponse.ok) {
          const userStoresList = await storesResponse.json();
          setUserStores(userStoresList);

          // Set all stores as default selection
          if (userStoresList.length > 0 && selectedStoreIds.length === 0) {
            setSelectedStoreIds(userStoresList.map((store: any) => store._id));
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch contracts when store selection changes
  useEffect(() => {
    const fetchContracts = async () => {
      if (userStores.length === 0) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) return;

        let allContracts: Contract[] = [];

        // Fetch contracts from selected stores
        for (const storeId of selectedStoreIds) {
          const response = await fetch(`http://40.81.244.202:8000/contracts?storeId=${storeId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const storeContracts = await response.json();
            allContracts = [...allContracts, ...storeContracts];
          }
        }

        setContracts(allContracts);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [selectedStoreIds, userStores]);

  // Filter contracts by selected dates first
  const filteredContracts = (contracts || []).filter(contract => {
    // Filter by selected dates (check if contract due date matches any selected date)
    const matchesDate = selectedDates.length === 0 || selectedDates.some(selectedDate => {
      try {
        const contractDueDate = new Date(contract.dates.dueDate);
        return isSameDate(contractDueDate, selectedDate);
      } catch (error) {
        return false;
      }
    });

    return matchesDate;
  });

  // Calculate contracts based on filtered data
  const contractsDueSoon = filteredContracts.filter(contract => {
    const dueDate = new Date(contract.dates.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3 && contract.status === 'active';
  }).map(contract => ({
    contractNo: contract.contractNumber,
    value: contract.pawnDetails.pawnedPrice,
    dueDate: contract.dates.dueDate,
    customerName: contract.customer?.fullName || 'ไม่ทราบชื่อ'
  }));

  const contractsOverdue = filteredContracts.filter(contract => {
    const dueDate = new Date(contract.dates.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7 && contract.status === 'overdue';
  }).map(contract => ({
    contractNo: contract.contractNumber,
    value: contract.pawnDetails.pawnedPrice,
    dueDate: contract.dates.dueDate,
    customerName: contract.customer?.fullName || 'ไม่ทราบชื่อ'
  }));

  const contractsSuspended = filteredContracts.filter(contract =>
    contract.status === 'suspended'
  ).map(contract => ({
    contractNo: contract.contractNumber,
    value: contract.pawnDetails.pawnedPrice,
    dueDate: contract.dates.dueDate,
    customerName: contract.customer?.fullName || 'ไม่ทราบชื่อ'
  }));

  // Calculate total value from filtered contracts (exclude sold, suspended and redeemed)
  // Include: pawnedPrice + totalInterest + fineAmount + payInterest
  const activeContracts = filteredContracts.filter(contract => 
    contract.status !== 'sold' && contract.status !== 'suspended' && contract.status !== 'redeemed'
  );
  const totalValue = activeContracts.reduce((sum, contract) => {
    const principal = contract.pawnDetails.pawnedPrice || 0;
    const interest = contract.pawnDetails.totalInterest || 0;
    const fine = contract.pawnDetails.fineAmount || 0;
    const paidInterest = contract.pawnDetails.payInterest || 0;
    return sum + principal + interest + fine + paidInterest;
  }, 0);

  // Calculate sold contracts value using soldAmount
  const soldContracts = filteredContracts.filter(contract => contract.status === 'sold');
  const soldValue = soldContracts.reduce((sum, contract) => 
    sum + (contract.pawnDetails.soldAmount || 0), 0
  );

  // Calculate suspended contracts value (awaiting sale) - only pawnedPrice
  const suspendedContracts = filteredContracts.filter(contract => contract.status === 'suspended');
  const suspendedValue = suspendedContracts.reduce((sum, contract) => 
    sum + contract.pawnDetails.pawnedPrice, 0
  );

  // Calculate current items data for legend
  const getCurrentItemsData = () => {
    const activeContracts = filteredContracts.filter(contract =>
      contract.status === 'active'
    );

    if (activeContracts.length === 0) {
      return [
        { name: 'No data', value: 100, color: '#e5e7eb' }
      ];
    }

    const itemTypeCounts: { [key: string]: number } = {};
    activeContracts.forEach(contract => {
      const itemType = contract.item.type || 'Other';
      itemTypeCounts[itemType] = (itemTypeCounts[itemType] || 0) + 1;
    });

    const sortedTypes = Object.entries(itemTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    const total = activeContracts.length;

    const colorMap: { [key: string]: string } = {
      'Smartphone': '#3b82f6',
      'Laptop': '#ef4444',
      'Tablet': '#f97316',
      'Phone': '#3b82f6',
      'Gaming': '#8b5cf6',
      'Electronics': '#06b6d4',
      'Jewelry': '#ec4899',
      'Watch': '#84cc16',
      'Other': '#6b7280'
    };

    return sortedTypes.map(([type, count]) => {
      const matchingKey = Object.keys(colorMap).find(key =>
        type.toLowerCase().includes(key.toLowerCase())
      );
      return {
        name: type,
        value: Math.round((count / total) * 100),
        color: matchingKey ? colorMap[matchingKey] : colorMap['Other']
      };
    });
  };

  const currentItemsData = getCurrentItemsData();
  const suspendedItemsData = getSuspendedItemsData(filteredContracts);

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
    setSelectedDates([new Date(newDate)]);
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    setShowTodayDropdown(false);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateKey = date.toDateString();
    const isSelected = selectedDates.some(d => d.toDateString() === dateKey);

    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== dateKey));
    } else {
      setSelectedDates([...selectedDates, new Date(date)]);
    }
  };

  const clearDateFilter = () => {
    setSelectedDates([]);
    setSelectedDate(null);
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showTodayDropdown) {
        setShowTodayDropdown(false);
      }
      if (showCalendarPopup) {
        setShowCalendarPopup(false);
      }
      if (showStoreDropdown) {
        // Only close if clicking outside the store filter area
        if (!target.closest('.store-filter-container')) {
          setShowStoreDropdown(false);
        }
      }
    };

    if (showTodayDropdown || showCalendarPopup || showStoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTodayDropdown, showCalendarPopup, showStoreDropdown]);

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
      const isSelected = selectedDates.some(d => isSameDate(d, currentDateObj));

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
    <div className={`flex flex-col lg:flex-row h-full gap-1 ${prompt.className}`}>
      <div className="w-full lg:w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
        {/* Top Header Section with Store Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-gray-800 text-[18px]">Foreclosed item value</h2>
            <TitleBadge text="มูลค่าของหลุดจำนำ" />
          </div>
          <div className="flex justify-end">
            <div className="relative store-filter-container">
              <div className="flex items-center bg-white border border-gray-300 rounded-md">
                <span className="px-3 py-1.5 text-sm">
                  🏪 Store Filter
                </span>
                <button
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  className="px-2 py-1.5 text-sm hover:bg-gray-50 transition-colors border-l border-gray-300"
                >
                  {showStoreDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {showStoreDropdown && (
                <div
                  className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[180px] p-2"
                >
                  <div className="space-y-1">
                    <label
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const allStoreIds = userStores.map(store => store._id);
                        if (selectedStoreIds.length === userStores.length) {
                          // If all selected, deselect all
                          setSelectedStoreIds([]);
                        } else {
                          // If not all selected, select all
                          setSelectedStoreIds(allStoreIds);
                        }
                        // Keep dropdown open - don't close it
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStoreIds.length === userStores.length}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span>📊 All Stores ({userStores.length})</span>
                    </label>
                    {userStores.map((store, index) => (
                      <label
                        key={store._id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const isSelected = selectedStoreIds.includes(store._id);
                          if (isSelected) {
                            setSelectedStoreIds(selectedStoreIds.filter(id => id !== store._id));
                          } else {
                            setSelectedStoreIds([...selectedStoreIds, store._id]);
                          }
                          // Keep dropdown open - don't close it
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStoreIds.includes(store._id)}
                          readOnly
                          className="w-4 h-4"
                        />
                        <span>🏪 {store.storeName || `Store ${index + 1}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Top Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
          {/* Card 1: Awaiting sale */}
          <div className="bg-[#B4CDB9] rounded-2xl p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Awaiting sale</h3>
                <p className="text-sm text-green-700">มูลค่ารอขาย</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-700">THB</p>
                <p className="text-2xl font-medium text-green-800">{suspendedValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-700">
              {suspendedContracts.length} contract{suspendedContracts.length !== 1 ? 's' : ''}
            </div>
          </div>
          {/* Card 2: Sold */}
          <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Sold</h3>
                <p className="text-sm text-gray-600">มูลค่าขายแล้ว</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">THB</p>
                <p className="text-2xl font-medium text-gray-800">{soldValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {soldContracts.length} contract{soldContracts.length !== 1 ? 's' : ''}
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
                  <CurrentItemsChart contracts={filteredContracts} />
                </div>
                <div className="space-y-2 text-xs">
                  {currentItemsData.map((item, index) => (
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
            <div className="bg-[#F0EFEF] rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[14px] font-semibold text-gray-700">Suspended items</h4>
                    <div className="bg-gray-100 text-[10px] text-gray-500 px-1.5 py-0.5 rounded-md">สัดส่วนสินค้าที่หลุดจำนำ</div>
                </div>
                <div className="bg-[#ffffff] rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-28 h-28 flex-shrink-0">
                    <SuspendedItemsChart contracts={filteredContracts} />
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
            <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-3 gap-3 justify-between items-start md:items-center cursor-pointer" onClick={() => setIsDueSoonExpanded(!isDueSoonExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Contracts due soon(D+3)</h3>
                    <p className="text-xs text-gray-600 font-light">สัญญากำลังจะถึงกำหนดในอีก 3 วัน</p>
                </div>
                <div className="hidden lg:block"></div>
                <div className="flex md:grid md:grid-cols-1 lg:grid-cols-3 items-center gap-3 sm:gap-4 w-full md:w-auto">
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
            <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-3 gap-3 justify-between items-start md:items-center cursor-pointer" onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Overdue contracts(D-7)</h3>
                    <p className="text-xs text-gray-600 font-light">สัญญาที่ขาดกำหนดเกินกำหนดมาไม่เกิน 7 วัน</p>
                </div>
                <div className="hidden lg:block"></div>
                <div className="flex md:grid md:grid-cols-1 lg:grid-cols-3 items-center gap-3 sm:gap-4 w-full md:w-auto">
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
            <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-3 gap-3 justify-between items-start md:items-center cursor-pointer" onClick={() => setIsSuspendedExpanded(!isSuspendedExpanded)}>
                <div>
                    <h3 className="text-base font-semibold text-gray-800">Suspended contracts</h3>
                    <p className="text-xs text-gray-600 font-light">สถานะกำลังจะหลุดจำนำ</p>
                </div>
                <div className="hidden lg:block"></div>
                <div className="flex md:grid md:grid-cols-1 lg:grid-cols-3 items-center gap-3 sm:gap-4 w-full md:w-auto">
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
      <div className="w-full lg:w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-3 flex-shrink-0 ml-auto">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-gray-800 text-[18px]">Pawned property value</h2>
            <TitleBadge text="มูลค่าทรัพย์สินจำนำรวม" />
          </div>
        </div>
        {/* Top Card Section */}
        <div className="bg-[#0A4215] text-[#F5F4F2] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Today Value</p>
              <p className="text-sm opacity-80">มูลค่ารวม</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">THB</p>
              <p className="text-2xl text-right flex justify-end">{totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="mt-2 text-xs opacity-80">
            {activeContracts.length} active contract{activeContracts.length !== 1 ? 's' : ''}
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

                {/* Selected dates display and clear button */}
                {selectedDates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Date filter active:</span>
                      <button
                        onClick={clearDateFilter}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedDates.map((date, index) => (
                        <span
                          key={index}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md"
                        >
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 bg-blue-50 rounded px-2 py-1">
                      📊 Dashboard showing data for contracts due on selected dates
                    </div>
                  </div>
                )}
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