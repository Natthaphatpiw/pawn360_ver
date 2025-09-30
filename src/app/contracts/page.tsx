'use client';

import React, { useState, useEffect, useRef } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Eye,
  Plus,
  Calendar,
  User,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  X
} from 'lucide-react';
import { Sarabun } from 'next/font/google';
const sarabun = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'],
});

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

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showTodayDropdown, setShowTodayDropdown] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [userStores, setUserStores] = useState<any[]>([]);

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
        const storesResponse = await fetch('http://127.0.0.1:8000/stores', {
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
          const response = await fetch(`http://127.0.0.1:8000/contracts?storeId=${storeId}`, {
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

  useEffect(() => {
    const handleClickOutside = () => {
      if (showTodayDropdown) {
        setShowTodayDropdown(false);
      }
      if (showCalendarPopup) {
        setShowCalendarPopup(false);
      }
      if (showStoreDropdown) {
        setShowStoreDropdown(false);
      }
    };

    if (showTodayDropdown || showCalendarPopup || showStoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTodayDropdown, showCalendarPopup, showStoreDropdown]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

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

  const getMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
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

    setSelectedDates([new Date(newDate)]);
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    setShowTodayDropdown(false);
  };

  const handleDateClick = (date: Date) => {
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
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const TitleBadge = ({ text }: { text: string }) => (
    <div className={`bg-[#CAC8C8] text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md ${sarabun.className}`}>
      {text}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Suspended' },
      sold: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Sold' },
      redeemed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Redeemed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || contract.status === statusFilter;

    // Filter by selected dates (check if contract due date matches any selected date)
    const matchesDate = selectedDates.length === 0 || selectedDates.some(selectedDate => {
      try {
        const contractDueDate = new Date(contract.dates.dueDate);
        return isSameDate(contractDueDate, selectedDate);
      } catch (error) {
        return false;
      }
    });

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <FixedLayout>
      <div className={`flex h-full gap-1 ${sarabun.className}`}>
        {/* Left Panel - Scrollable */}
        <div className="w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">

          {/* Search Section */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Search</h2>
              <TitleBadge text="ค้นหา" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-between">
                <div className="gap-[0.1rem] w-1/3">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Contract No.</label>
                  <p className="text-gray-500 mb-1 text-[12px]">เลขที่สัญญา</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contract..."
                    className="flex-1 px-[9rem] py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      if (!searchQuery.trim()) return;

                      setLoading(true);
                      try {
                        const token = localStorage.getItem('access_token');
                        if (!token) return;

                        let searchResults: Contract[] = [];

                        // Search across selected stores
                        for (const storeId of selectedStoreIds) {
                          const response = await fetch(`http://127.0.0.1:8000/contracts?storeId=${storeId}`, {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });

                          if (response.ok) {
                            const storeContracts = await response.json();
                            // Filter contracts by search query
                            const filtered = storeContracts.filter((contract: Contract) =>
                              contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              contract.customer?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                            searchResults = [...searchResults, ...filtered];
                          }
                        }

                        setContracts(searchResults);
                      } catch (err) {
                        console.error('Search error:', err);
                        setError('Search failed');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-6 py-3 bg-[#487C47] text-white rounded-lg hover:bg-[#386337] transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Filter</h2>
              <TitleBadge text="กรองข้อมูล" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-between">
                <div className="gap-[0.1rem] w-1/5">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Status</label>
                  <p className="text-gray-500 mb-1 text-[12px]">สถานะ</p>
                </div>
                <select
                  className="w-4/5 px-[1rem] py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="suspended">Suspended</option>
                  <option value="sold">Sold</option>
                  <option value="redeemed">Redeemed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Contracts</h2>
              <TitleBadge text="รายการสัญญา" />
            </div>
            <div className="bg-white rounded-lg mt-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contract No.</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Item</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Value</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          Loading contracts...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-red-500">
                          {error}
                        </td>
                      </tr>
                    ) : filteredContracts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No contracts found
                        </td>
                      </tr>
                    ) : (
                      filteredContracts.map((contract, index) => (
                        <tr
                          key={contract._id}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          onClick={() => router.push(`/contracts/${contract._id}`)}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900 text-sm">{contract.contractNumber}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900 text-sm">{contract.item.model}</div>
                            <div className="text-gray-500 text-xs">{contract.item.brand} • {contract.item.type}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900 text-sm font-medium">{formatCurrency(contract.pawnDetails.pawnedPrice)} THB</div>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(contract.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900 text-sm">{new Date(contract.dates.dueDate).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contracts/${contract._id}`);
                              }}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="View contract details"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Scrollable */}
        <div className="w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Store Filter */}
          <div className="flex justify-end">
            <div className="relative">
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
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
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

          {/* Calendar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{getMonthYear(currentDate)}</h3>
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
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {renderCalendar()}

            {/* Selected dates display and clear button */}
            {selectedDates.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Selected dates:</span>
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
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Statistics</h2>
              <TitleBadge text="สถิติ" />
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Contracts</span>
                <span className="font-medium text-gray-900">{contracts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active</span>
                <span className="font-medium text-green-600">{contracts.filter(c => c.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="font-medium text-red-600">{contracts.filter(c => c.status === 'overdue').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Suspended</span>
                <span className="font-medium text-orange-600">{contracts.filter(c => c.status === 'suspended').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="font-medium text-gray-900">{formatCurrency(contracts.reduce((sum, c) => sum + c.pawnDetails.pawnedPrice, 0))} THB</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <TitleBadge text="เมนูด่วน" />
            </div>
            <div className="space-y-2 mt-4">
              <button
                onClick={() => router.push('/pawn-entry')}
                className="w-full bg-[#386337] text-white py-2 rounded-lg hover:bg-[#0A4215] transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                New Contract
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </FixedLayout>
  );
}