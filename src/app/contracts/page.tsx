'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
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
  MoreHorizontal
} from 'lucide-react';

interface Contract {
  id: string;
  contractNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  item: {
    brand: string;
    model: string;
    type: string;
  };
  pawnedPrice: number;
  interestRate: number;
  startDate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'redeemed' | 'suspended' | 'sold';
  totalValue: number;
}

// Mock contracts data matching screenshot
const mockContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'BCOK87CAKZ05',
    customer: { name: 'Customer 1', phone: '0812345678' },
    item: { brand: 'Apple', model: 'MacBook Air M3', type: 'Laptop' },
    pawnedPrice: 12300,
    interestRate: 3.0,
    startDate: '2024-12-01',
    dueDate: '2025-07-09',
    status: 'overdue',
    totalValue: 12300
  },
  {
    id: '2',
    contractNumber: '6UIT5SZ3H0CJ',
    customer: { name: 'Customer 2', phone: '0987654321' },
    item: { brand: 'Apple', model: 'IdeaPad Slim 7', type: 'Laptop' },
    pawnedPrice: 14000,
    interestRate: 3.0,
    startDate: '2024-11-15',
    dueDate: '2025-07-09',
    status: 'overdue',
    totalValue: 14000
  },
  {
    id: '3',
    contractNumber: '5LX7053KG8HR',
    customer: { name: 'Customer 3', phone: '0856789123' },
    item: { brand: 'ASUS', model: 'ROG Ally', type: 'Gaming Device' },
    pawnedPrice: 10000,
    interestRate: 3.5,
    startDate: '2024-12-01',
    dueDate: '2025-07-09',
    status: 'overdue',
    totalValue: 10000
  },
  {
    id: '4',
    contractNumber: '4U98RYSISFG0',
    customer: { name: 'Customer 4', phone: '0823456789' },
    item: { brand: 'Apple', model: 'Apple TV 4K', type: 'Streaming Device' },
    pawnedPrice: 5000,
    interestRate: 2.0,
    startDate: '2024-10-15',
    dueDate: '2025-07-08',
    status: 'overdue',
    totalValue: 5000
  },
  {
    id: '5',
    contractNumber: 'EUPLGECL3NRE',
    customer: { name: 'Customer 5', phone: '0867891234' },
    item: { brand: 'Apple', model: 'iPad Air 5th Gen', type: 'Tablet' },
    pawnedPrice: 11000,
    interestRate: 4.0,
    startDate: '2024-09-01',
    dueDate: '2025-07-09',
    status: 'overdue',
    totalValue: 11000
  },
  {
    id: '6',
    contractNumber: 'JIT9PERGCJNY',
    customer: { name: 'Customer 6', phone: '0834567890' },
    item: { brand: 'Apple', model: 'iPad Air 5th Gen', type: 'Tablet' },
    pawnedPrice: 15000,
    interestRate: 3.0,
    startDate: '2024-11-01',
    dueDate: '2025-07-09',
    status: 'overdue',
    totalValue: 15000
  },
  {
    id: '7',
    contractNumber: 'BSY5NF7MLPC5',
    customer: { name: 'Customer 7', phone: '0845678901' },
    item: { brand: 'Samsung', model: 'Galaxy Tab S9', type: 'Tablet' },
    pawnedPrice: 10000,
    interestRate: 2.5,
    startDate: '2024-10-15',
    dueDate: '2025-06-09',
    status: 'overdue',
    totalValue: 10000
  },
  {
    id: '8',
    contractNumber: 'NXGQ0HSBQEDP',
    customer: { name: 'Customer 8', phone: '0856789012' },
    item: { brand: 'Apple', model: 'iPhone 15 Pro Max', type: 'Smartphone' },
    pawnedPrice: 5000,
    interestRate: 3.5,
    startDate: '2024-09-01',
    dueDate: '2025-28/08',
    status: 'sold',
    totalValue: 5000
  }
];

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = currentDate.getDate();
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Day headers
    const dayHeaders = dayNames.map(day => (
      <div key={day} className="text-xs font-medium text-clay-grey text-center p-2">
        {day}
      </div>
    ));

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      days.push(
        <div 
          key={day}
          className={`p-2 text-center text-sm cursor-pointer hover:bg-l-grey-1 rounded ${
            isToday ? 'bg-leaf-green text-white font-bold' : 'text-d-grey-5'
          }`}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayHeaders}
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
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      overdue: { bg: 'bg-green-100', text: 'text-green-800', label: 'Overdue' },
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
                         contract.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-d-grey-5">Contracts</h1>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-d-grey-5 mb-2">Search contract</h3>
                <p className="text-sm text-clay-grey">ค้นหาสัญญา</p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contract no."
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-clay-grey" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                  >
                    <option value="">Status filter</option>
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-l-grey-2">
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey">Contract no.</th>
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey">Item</th>
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey">Value</th>
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey">Status</th>
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey">Due date</th>
                      <th className="text-left py-4 px-2 text-sm font-medium text-clay-grey"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="border-b border-l-grey-1 hover:bg-l-grey-1 transition-colors">
                        <td className="py-4 px-2">
                          <div className="font-medium text-d-grey-5">{contract.contractNumber}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-d-grey-5">{contract.item.model}</div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-d-grey-5">{formatCurrency(contract.pawnedPrice)}</div>
                        </td>
                        <td className="py-4 px-2">
                          {getStatusBadge(contract.status)}
                        </td>
                        <td className="py-4 px-2">
                          <div className="text-d-grey-5">{contract.dueDate}</div>
                        </td>
                        <td className="py-4 px-2">
                          <button 
                            onClick={() => router.push(`/contracts/${contract.id}`)}
                            className="p-2 hover:bg-l-grey-2 rounded-lg transition-colors"
                          >
                            <MoreHorizontal size={16} className="text-clay-grey" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div className="space-y-6">
            {/* Today's Date Display */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-d-grey-5">today</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-l-grey-1 rounded"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-l-grey-1 rounded"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-medium text-d-grey-5 mb-4">{getMonthYear(currentDate)}</h3>
              {renderCalendar()}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}