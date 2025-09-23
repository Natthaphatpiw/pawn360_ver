'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Calendar, 
  Camera,
  User,
  Package,
  DollarSign,
  Percent,
  Clock,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Eye
} from 'lucide-react';

interface CustomerData {
  fullName: string;
  phoneNumber: string;
  idNumber: string;
  address: {
    street: string;
    subDistrict: string;
    district: string;
    province: string;
    postcode: string;
  };
}

interface ItemData {
  brand: string;
  model: string;
  serialNo: string;
  accessories: string;
  condition: number;
  defects: string;
  note: string;
  images: File[];
}

interface PawnDetails {
  aiEstimatedPrice: number;
  pawnedPrice: number;
  interestRate: number;
  periodDays: number;
}

export default function PawnEntryPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [customerData, setCustomerData] = useState<CustomerData>({
    fullName: '',
    phoneNumber: '',
    idNumber: '',
    address: {
      street: '',
      subDistrict: '',
      district: '',
      province: '',
      postcode: ''
    }
  });

  const [itemData, setItemData] = useState<ItemData>({
    brand: '',
    model: '',
    serialNo: '',
    accessories: '',
    condition: 80,
    defects: '',
    note: '',
    images: []
  });

  const [pawnDetails, setPawnDetails] = useState<PawnDetails>({
    aiEstimatedPrice: 0,
    pawnedPrice: 0,
    interestRate: 3.0,
    periodDays: 30
  });

  const brands = ['Apple', 'Samsung', 'Sony', 'Canon', 'Nike', 'Rolex', 'Tiffany & Co.'];
  const titlePrefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'];

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

  const handleCustomerSearch = () => {
    // Mock search functionality
    if (searchQuery.includes('0812345678')) {
      setCustomerData({
        fullName: 'John Smith',
        phoneNumber: '0812345678',
        idNumber: '1234567890123',
        address: {
          street: '123 Sample Street',
          subDistrict: 'Pathumwan',
          district: 'Pathumwan',
          province: 'Bangkok',
          postcode: '10330'
        }
      });
    } else {
      setIsNewCustomer(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setItemData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 5) // Max 5 images
      }));
    }
  };

  const removeImage = (index: number) => {
    setItemData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Customer:', customerData);
    console.log('Item:', itemData);
    console.log('Pawn Details:', pawnDetails);
    // Navigate to contracts page or show success message
    router.push('/contracts');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-d-grey-5">Pawn Entry</h1>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Content - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-d-grey-5 mb-2">Search</h3>
                <p className="text-sm text-clay-grey">ค้นหา</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-d-grey-5 mb-2">
                  ID Number
                </label>
                <p className="text-sm text-clay-grey mb-3">เลขบัตรประชาชน 13 หลัก</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    className="flex-1 px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                  />
                  <button
                    onClick={handleCustomerSearch}
                    className="px-6 py-3 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Registration Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-d-grey-5 mb-2">Registration</h3>
                <p className="text-sm text-clay-grey">ลงทะเบียนลูกค้า</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Title
                  </label>
                  <p className="text-sm text-clay-grey mb-3">คำานำหน้าชื่อ</p>
                  <select className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent">
                    <option value="">Mr. (นาย)</option>
                    <option value="mrs">Mrs. (นาง)</option>
                    <option value="ms">Ms. (นางสาว)</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    First name
                  </label>
                  <p className="text-sm text-clay-grey mb-3">ชื่อ</p>
                  <input
                    type="text"
                    placeholder="ก่อง่อง"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    value={customerData.fullName.split(' ')[0] || ''}
                    onChange={(e) => {
                      const lastName = customerData.fullName.split(' ')[1] || '';
                      setCustomerData(prev => ({
                        ...prev,
                        fullName: `${e.target.value} ${lastName}`.trim()
                      }));
                    }}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Last name
                  </label>
                  <p className="text-sm text-clay-grey mb-3">นามสกุล</p>
                  <input
                    type="text"
                    placeholder="นามสกุล"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    value={customerData.fullName.split(' ')[1] || ''}
                    onChange={(e) => {
                      const firstName = customerData.fullName.split(' ')[0] || '';
                      setCustomerData(prev => ({
                        ...prev,
                        fullName: `${firstName} ${e.target.value}`.trim()
                      }));
                    }}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Phone number
                  </label>
                  <p className="text-sm text-clay-grey mb-3">เบอร์โทรศัพท์</p>
                  <input
                    type="tel"
                    placeholder="000-000-0000"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    value={customerData.phoneNumber}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    ID Number
                  </label>
                  <p className="text-sm text-clay-grey mb-3">เลขบัตรประชาชน</p>
                  <input
                    type="text"
                    placeholder="x-xxxx-xxxxx-xx-x"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    value={customerData.idNumber}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, idNumber: e.target.value }))}
                  />
                </div>

                {/* Address Fields */}
                <div className="col-span-2">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Address (เลขที่)
                      </label>
                      <input
                        type="text"
                        placeholder="บ้านเลขที่"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        value={customerData.address.street}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                      />
                    </div>

                    {/* Village/Building */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Village/Building (หมู่บ้าน/อาคาร)
                      </label>
                      <input
                        type="text"
                        placeholder="หมู่บ้าน/อาคาร"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    </div>

                    {/* Street */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Street (ถนน/ซอย/ตรอก)
                      </label>
                      <input
                        type="text"
                        placeholder="ถนน/ซอย/ตรอก"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      />
                    </div>

                    {/* Sub-district */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Sub-district (แขวง/ตำบล)
                      </label>
                      <input
                        type="text"
                        placeholder="แขวง/ตำบล"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        value={customerData.address.subDistrict}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          address: { ...prev.address, subDistrict: e.target.value }
                        }))}
                      />
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        District (เขต/อำเภอ)
                      </label>
                      <input
                        type="text"
                        placeholder="เขต/อำเภอ"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        value={customerData.address.district}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          address: { ...prev.address, district: e.target.value }
                        }))}
                      />
                    </div>

                    {/* Province */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Province (จังหวัด)
                      </label>
                      <input
                        type="text"
                        placeholder="จังหวัด"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        value={customerData.address.province}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          address: { ...prev.address, province: e.target.value }
                        }))}
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Country (ประเทศ)
                      </label>
                      <input
                        type="text"
                        placeholder="ประเทศ"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        defaultValue="ประเทศ"
                      />
                    </div>

                    {/* Postcode */}
                    <div>
                      <label className="block text-sm font-medium text-d-grey-5 mb-2">
                        Postcode (รหัสไปรษณีย์)
                      </label>
                      <input
                        type="text"
                        placeholder="xxxxx"
                        className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                        value={customerData.address.postcode}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          address: { ...prev.address, postcode: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Information Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-d-grey-5 mb-2">Item Information</h3>
                <p className="text-sm text-clay-grey">ข้อมูลสินค้า</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Brand
                  </label>
                  <p className="text-sm text-clay-grey mb-3">ยี่ห้อ</p>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                      value={itemData.brand}
                      onChange={(e) => setItemData(prev => ({ ...prev, brand: e.target.value }))}
                    >
                      <option value="">ยี่ห้อ</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className="px-4 py-3 border border-l-grey-4 rounded-lg hover:bg-l-grey-1 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-d-grey-5 mb-2">
                    Model
                  </label>
                  <p className="text-sm text-clay-grey mb-3">รุ่น</p>
                  <input
                    type="text"
                    placeholder="รุ่น"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg focus:ring-2 focus:ring-leaf-green focus:border-transparent"
                    value={itemData.model}
                    onChange={(e) => setItemData(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Customer Info & Calendar */}
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

            {/* Customer Information Preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <h3 className="text-lg font-semibold text-d-grey-5 mb-4">Customer information</h3>
              <p className="text-sm text-clay-grey mb-4">ข้อมูลลูกค้า</p>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-d-grey-5">Full name</div>
                  <div className="text-sm text-clay-grey">ชื่อ - นามสกุล</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-d-grey-5">Phone number</div>
                  <div className="text-sm text-clay-grey">Phone number</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-d-grey-5">ID Number</div>
                  <div className="text-sm text-clay-grey">เลขบัตรประชาชน</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-d-grey-5">Address</div>
                  <div className="text-sm text-clay-grey">ที่อยู่</div>
                  <div className="text-xs text-clay-grey">.......</div>
                </div>
              </div>
            </div>

            {/* Item Information Preview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <h3 className="text-lg font-semibold text-d-grey-5 mb-4">Item information</h3>
              <p className="text-sm text-clay-grey mb-4">ข้อมูลของสินค้า</p>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-d-grey-5">Item</div>
                  <div className="text-sm text-clay-grey">สินค้า</div>
                  <div className="text-xs text-clay-grey">| |</div>
                </div>
              </div>
            </div>

            {/* Preview & Create Button */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-l-grey-2">
              <button 
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-4 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Preview & Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}