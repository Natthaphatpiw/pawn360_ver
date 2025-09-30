'use client';

import React, { useState, useEffect } from 'react';
import FixedLayout from '@/components/layout/FixedLayout';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Sarabun } from 'next/font/google';
const sarabun = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'],
});

export default function PawnEntryPage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const today = new Date(); // Current date (today is September 25, 2025)
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); // Current month
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTodayDropdown, setShowTodayDropdown] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);

  // Customer data state
  const [customerData, setCustomerData] = useState({
    title: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    idNumber: '',
    address: '',
    village: '',
    street: '',
    subDistrict: '',
    district: '',
    province: '',
    country: 'ประเทศไทย',
    postcode: ''
  });

  // Item data state
  const [itemData, setItemData] = useState({
    brand: '',
    model: '',
    type: '',
    serialNo: '',
    accessories: '',
    condition: '0',
    defects: '',
    note: ''
  });

  // States for dropdowns
  const [brands, setBrands] = useState(['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'ASUS', 'MSI', 'Acer']);
  const [models, setModels] = useState(['iPhone 15', 'MacBook Pro', 'Galaxy S24', 'ThinkPad X1', 'ROG Strix']);
  const [types, setTypes] = useState(['Smartphone', 'Laptop', 'Desktop', 'Tablet', 'Gaming PC', 'Monitor']);

  // States for add new items
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [isDueSoonExpanded, setIsDueSoonExpanded] = useState(false);
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);
  const [isSuspendedExpanded, setIsSuspendedExpanded] = useState(false);

  // Sorting states
  const [dueSoonSort, setDueSoonSort] = useState({ field: '', order: 'default' });
  const [overdueSort, setOverdueSort] = useState({ field: '', order: 'default' });
  const [suspendedSort, setSuspendedSort] = useState({ field: '', order: 'default' });

  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState('');

  // Customer data handlers
  const handleCustomerDataChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Item data handlers
  const handleItemDataChange = (field: string, value: string) => {
    setItemData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Contract preview functions
  const handleShowContractPreview = () => {
    setShowContractPreview(true);
  };

  const handleCloseContractPreview = () => {
    setShowContractPreview(false);
  };

  const handleCreateContract = () => {
    // TODO: Implement contract creation logic
    console.log('Creating contract with data:', { customerData, itemData });
    // For now, just close the modal and redirect
    setShowContractPreview(false);
    router.push('/contracts');
  };

  // Helper functions for display
  const getFullName = () => {
    const { title, firstName, lastName } = customerData;
    const titleText = title === 'mrs' ? 'นาง' : title === 'ms' ? 'นางสาว' : 'นาย';
    return `${titleText} ${firstName} ${lastName}`.trim();
  };

  const getFullAddress = () => {
    const { address, village, street, subDistrict, district, province, country, postcode } = customerData;
    const parts = [address, village, street, subDistrict, district, province, country, postcode].filter(Boolean);
    return parts.join(' ');
  };

  // Helper functions for item display
  const getItemDescription = () => {
    const { brand, model, type } = itemData;
    const parts = [brand, model, type].filter(Boolean);
    return parts.join(' ');
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

  // Functions to add new items
  const handleAddBrand = () => {
    if (newBrand.trim()) {
      setBrands([...brands, newBrand.trim()]);
      setNewBrand('');
      setShowAddBrand(false);
    }
  };

  const handleAddModel = () => {
    if (newModel.trim()) {
      setModels([...models, newModel.trim()]);
      setNewModel('');
      setShowAddModel(false);
    }
  };

  const handleAddType = () => {
    if (newType.trim()) {
      setTypes([...types, newType.trim()]);
      setNewType('');
      setShowAddType(false);
    }
  };

  const TitleBadge = ({ text }: { text: string }) => (
    <div className={`bg-[#CAC8C8] text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md ${sarabun.className}`}>
      {text}
    </div>
  );

  // Contract Preview Modal Component
  const ContractPreviewModal = () => {
    if (!showContractPreview) return null;

    const DottedLine = ({ length = 40 }: { length?: number }) => (
        <span className="border-b border-dotted border-gray-400 inline-block align-bottom" style={{ width: `${length * 0.5}em` }}></span>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseContractPreview}>
            <div className="flex items-start gap-4" onClick={(e) => e.stopPropagation()}>
                {/* Left Panel: Confirmation */}
                <div className="w-80 bg-white rounded-xl shadow-xl border flex-shrink-0">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-semibold">Contract Confirmation</h3>
                            <TitleBadge text="ยืนยันการสร้างสัญญา" />
                        </div>
                        <div className="mb-6">
                            <p className="text-sm text-gray-700 font-medium mb-2">Once created,</p>
                            <p className="text-sm text-gray-700 font-medium mb-4">the contract takes effect immediately.</p>
                            <p className="text-sm text-gray-500">เมื่อสร้างแล้ว สัญญาจะมีผลทันที</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseContractPreview}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateContract}
                                className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Document Preview */}
                <div className="bg-gray-200 p-8 rounded-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
                    <div className="bg-white shadow-lg p-16 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                        <div className={`text-black ${sarabun.className}`} style={{ fontSize: '16pt', lineHeight: '1.8' }}>
                            <h2 className="text-center font-bold text-3xl mb-12">สัญญาจำนำ</h2>
                            <p className="text-right mb-12">
                                วันที่<DottedLine length={30} />
                            </p>
                            <p style={{ textIndent: '4em' }} className="mb-6">
                                ข้าพเจ้า(นาย/นาง/นางสาว)<DottedLine length={20} />ขอมอบหนังสือยินยอมการหัก
                                ( ) ทุนเรือนหุ้น ( ) สมุดเงินฝากออมทรัพย์ เลขที่<DottedLine length={20} />ฉบับนี้ ตลอดจนสิทธิ์ใดๆ ที่มีอยู่ใน
                                สหกรณ์ออมทรัพย์กรมสุขภาพจิต จำกัด นี้ จำนำไว้กับทางสหกรณ์ออมทรัพย์กรมสุขภาพจิต จำกัด เพื่อเป็น
                                ประกันหนี้เงินกู้ ( ) สามัญ ( )<DottedLine length={20} />ของ<DottedLine length={20} />
                                เป็นจำนวนเงิน<DottedLine length={15} />บาท (<DottedLine length={30} />) ข้าพเจ้ายินยอมให้สหกรณ์
                                ออมทรัพย์กรมสุขภาพจิต จำกัด หักเงินจำนวนใดๆ จาก ( ) ทุนเรือนหุ้น ( ) สมุดเงินฝากออมทรัพย์
                                เลขที่<DottedLine length={15} />ของข้าพเจ้า ตามสัญญากู้เงินเลขที่<DottedLine length={15} />ลงวันที่<DottedLine length={20} />ซึ่งได้ระบุไว้
                                ข้างต้น และไม่จำต้องนำทรัพย์ที่จำนำนี้ออกขายทอดตลาด ทั้งนี้ให้ถือการสลักหลักนี้เป็นการบอกกล่าวการ
                                จำนำกับสหกรณ์ออมทรัพย์กรมสุขภาพจิต จำกัด
                            </p>
                            <p style={{ textIndent: '4em' }} className="mb-6">
                                ข้าพเจ้าจะไม่เพิกถอนข้อสัญญานี้ เมื่อหนี้ดังกล่าวยังมิได้ชำระแก่สหกรณ์ออมทรัพย์ กรม
                                สุขภาพจิต จำกัด ให้เสร็จสิ้น
                            </p>
                            <p style={{ textIndent: '4em' }} className="mb-10">
                                ข้าพเจ้า นาย / นาง / นางสาว<DottedLine length={25} />สามี / ภรรยา ของผู้จำนำ
                                ขอให้คำยินยอมในการที่สามี / ภรรยา ของข้าพเจ้าได้จำนำ ( ) ทุนเรือนหุ้น ( ) สมุดเงินฝากออมทรัพย์
                                เลขที่<DottedLine length={20} />ดังกล่าว โดยข้าพเจ้าตกลงให้คำยินยอมในการกระทำนี้ตลอดไป จึงลงลายมือชื่อไว้ต่อ
                                หน้าพยาน ณ วัน เดือน ปี มีระบุข้างต้น
                            </p>
                            
                            <div className="w-full max-w-md mx-auto" style={{marginTop: '4rem'}}>
                                <div className="text-center mb-12">
                                    <p>ลงชื่อ<DottedLine length={30} />ผู้จำนำ</p>
                                    <p>(<DottedLine length={40} />)</p>
                                </div>
                                <div className="text-center mb-12">
                                    <p>ลงชื่อ<DottedLine length={20} />ภรรยา / สามี ให้ความยินยอม</p>
                                    <p>(<DottedLine length={40} />)</p>
                                </div>
                                <div className="text-center">
                                    <p>ลงชื่อ<DottedLine length={30} />พยาน</p>
                                    <p>(<DottedLine length={40} />)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
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

  return (
    <>
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
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">ID Number</label>
                  <p className="text-gray-500 mb-1 text-[12px]">เลขบัตรประชาชน 13 หลัก</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    className="flex-1 px-[9rem] py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-[#487C47] text-white rounded-lg hover:bg-[#386337] transition-colors">
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Section */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Registration</h2>
              <TitleBadge text="ลงทะเบียนลูกค้า" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-between">
                <div className="gap-[0.1rem] w-1/5">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Title</label>
                  <p className="text-gray-500 mb-1 text-[12px]">คำนำหน้าชื่อ</p>
                </div>
                <select
                  className="w-4/5 px-[1rem] py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={customerData.title}
                  onChange={(e) => handleCustomerDataChange('title', e.target.value)}
                >
                  <option value="">Mr. (นาย)</option>
                  <option value="mrs">Mrs. (นาง)</option>
                  <option value="ms">Ms. (นางสาว)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 justify-between">
                  <div className="gap-[0.1rem] w-2/5">
                    <label className="block font-medium text-gray-700 mb-1 text-[16px]">First name</label>
                    <p className="text-gray-500 mb-1 text-[12px]">ชื่อ</p>
                  </div>
                  <input
                    type="text"
                    placeholder="ชื่อจริง"
                    className="w-3/5 px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.firstName}
                    onChange={(e) => handleCustomerDataChange('firstName', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <div className="gap-[0.1rem] w-2/5">
                    <label className="block font-medium text-gray-700 mb-1 text-[16px]">Last name</label>
                    <p className="text-gray-500 mb-1 text-[12px]">นามสกุล</p>
                  </div>
                  <input
                    type="text"
                    placeholder="นามสกุล"
                    className="w-3/5 px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.lastName}
                    onChange={(e) => handleCustomerDataChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-between">
                <div className="gap-[0.1rem] w-1/5">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Phone number</label>
                  <p className="text-gray-500 mb-1 text-[12px]">เบอร์โทรศัพท์</p>
                </div>
                <input
                  type="tel"
                  placeholder="000-000-0000"
                  className="w-4/5 px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={customerData.phoneNumber}
                  onChange={(e) => handleCustomerDataChange('phoneNumber', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 justify-between">
                <div className="gap-[0.1rem] w-1/5">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">ID Number</label>
                  <p className="text-gray-500 mb-1 text-[12px]">เลขบัตรประชาชน</p>
                </div>
                <input
                  type="text"
                  placeholder="X-XXXX-XXXXX-XX-X"
                  className="w-4/5 px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={customerData.idNumber}
                  onChange={(e) => handleCustomerDataChange('idNumber', e.target.value)}
                />
              </div>
              <div className="h-[1px] bg-gray-300 w-full"></div>

              {/* Address Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Address (เลขที่)</label>
                  <input
                    type="text"
                    placeholder="บ้านเลขที่"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.address}
                    onChange={(e) => handleCustomerDataChange('address', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Village/Building (หมู่บ้าน/อาคาร)</label>
                  <input
                    type="text"
                    placeholder="หมู่บ้าน/อาคาร"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.village}
                    onChange={(e) => handleCustomerDataChange('village', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Street (ถนน/ซอย/ตรอก)</label>
                  <input
                    type="text"
                    placeholder="ถนน/ซอย/ตรอก"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.street}
                    onChange={(e) => handleCustomerDataChange('street', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Sub-district (แขวง/ตำบล)</label>
                  <input
                    type="text"
                    placeholder="แขวง/ตำบล"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.subDistrict}
                    onChange={(e) => handleCustomerDataChange('subDistrict', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">District (เขต/อำเภอ)</label>
                  <input
                    type="text"
                    placeholder="เขต/อำเภอ"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.district}
                    onChange={(e) => handleCustomerDataChange('district', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Province (จังหวัด)</label>
                  <input
                    type="text"
                    placeholder="จังหวัด"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.province}
                    onChange={(e) => handleCustomerDataChange('province', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Country (ประเทศ)</label>
                  <input
                    type="text"
                    placeholder="ประเทศ"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.country}
                    onChange={(e) => handleCustomerDataChange('country', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1 text-[14px]">Postcode (รหัสไปรษณีย์)</label>
                  <input
                    type="text"
                    placeholder="xxxxx"
                    className="w-full px-4 py-1 text-[12px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={customerData.postcode}
                    onChange={(e) => handleCustomerDataChange('postcode', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Item Information */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Item Information</h2>
              <TitleBadge text="ข้อมูลสินค้า" />
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Brand</label>
                  <p className="text-gray-500 mb-1 text-[14px]">ยี่ห้อ</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                  <select
                    className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={itemData.brand}
                    onChange={(e) => handleItemDataChange('brand', e.target.value)}
                  >
                    <option value="">เลือกยี่ห้อ</option>
                    {brands.map((brand, index) => (
                      <option key={index} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setShowAddBrand(true)}
                    className="px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {/* Add Brand Modal */}
                {showAddBrand && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                      <h3 className="text-lg font-semibold mb-4">เพิ่มยี่ห้อใหม่</h3>
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="ชื่อยี่ห้อ"
                        className="w-full px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowAddBrand(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleAddBrand}
                          className="px-4 py-2 bg-[#487C47] text-white rounded-lg hover:bg-[#386337]"
                        >
                          เพิ่ม
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-2">
                  <div className="gap-[0.1rem] w-2/5">
                    <label className="block font-medium text-gray-700 mb-1 text-[16px]">Model</label>
                    <p className="text-gray-500 mb-1 text-[14px]">รุ่น</p>
                  </div>
                  <div className="flex gap-2 justify-end w-3/5">
                    <select
                      className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={itemData.model}
                      onChange={(e) => handleItemDataChange('model', e.target.value)}
                    >
                      <option value="">เลือกรุ่น</option>
                      {models.map((model, index) => (
                        <option key={index} value={model}>{model}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setShowAddModel(true)}
                      className="px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  {/* Add Model Modal */}
                  {showAddModel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">เพิ่มรุ่นใหม่</h3>
                        <input
                          type="text"
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="ชื่อรุ่น"
                          className="w-full px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowAddModel(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleAddModel}
                            className="px-4 py-2 bg-[#487C47] text-white rounded-lg hover:bg-[#386337]"
                          >
                            เพิ่ม
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 justify-between">
                  <div className="gap-[0.1rem] w-1/5">
                    <label className="block font-medium text-gray-700 mb-1 text-[16px]">Type</label>
                    <p className="text-gray-500 mb-1 text-[14px]">ประเภท</p>
                  </div>
                  <div className="flex gap-2 justify-end w-4/5">
                    <select
                      className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={itemData.type}
                      onChange={(e) => handleItemDataChange('type', e.target.value)}
                    >
                      <option value="">เลือกประเภท</option>
                      {types.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setShowAddType(true)}
                      className="px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  {/* Add Type Modal */}
                  {showAddType && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">เพิ่มประเภทใหม่</h3>
                        <input
                          type="text"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          placeholder="ชื่อประเภท"
                          className="w-full px-4 py-[0.5rem] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowAddType(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleAddType}
                            className="px-4 py-2 bg-[#487C47] text-white rounded-lg hover:bg-[#386337]"
                          >
                            เพิ่ม
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Serial no.</label>
                  <p className="text-gray-500 mb-1 text-[14px]">หมายเลขซีเรียล</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                <input
                  type="text"
                  placeholder="หมายเลขซีเรียล"
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemData.serialNo}
                  onChange={(e) => handleItemDataChange('serialNo', e.target.value)}
                />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Accessories</label>
                  <p className="text-gray-500 mb-1 text-[14px]">อุปกรณ์เสริม</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                <input
                  type="text"
                  placeholder="อุปกรณ์เสริม"
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemData.accessories}
                  onChange={(e) => handleItemDataChange('accessories', e.target.value)}
                />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Condition</label>
                  <p className="text-gray-500 mb-1 text-[14px]">สภาพ</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                <div className="flex items-center gap-4 w-full">
                  <span className="text-sm whitespace-nowrap">สภาพ</span>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={itemData.condition}
                      onChange={(e) => handleItemDataChange('condition', e.target.value)}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer slider"
                      style={{'--slider-value': `${itemData.condition}%`} as React.CSSProperties}
                    />
                    <span className="text-sm w-10 text-center">{itemData.condition}%</span>
                  </div>
                </div>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Defects</label>
                  <p className="text-gray-500 mb-1 text-[14px]">ตำหนิ</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                <input
                  type="text"
                  placeholder="ตำหนิ"
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemData.defects}
                  onChange={(e) => handleItemDataChange('defects', e.target.value)}
                />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between grid grid-cols-5">
                <div className="gap-[0.1rem]">
                  <label className="block font-medium text-gray-700 mb-1 text-[16px]">Note</label>
                  <p className="text-gray-500 mb-1 text-[14px]">หมายเหตุ</p>
                </div>
                <div className="flex gap-2 justify-end col-span-4">
                <textarea
                  placeholder="หมายเหตุ"
                  rows={3}
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={itemData.note}
                  onChange={(e) => handleItemDataChange('note', e.target.value)}
                />
                </div>
              </div>
            </div>
          </div>

          {/* Pawn Details */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200 space-y-4">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Pawn details</h2>
              <TitleBadge text="รายละเอียดการจำนำ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-2xl p-4 border border-green-200 col-span-1 flex flex-col h-full">
                <div className="text-lg text-gray-600 mb-3 text-[18px]">AI-estimated price</div>
                <div className="flex items-center gap-2 justify-between">
                  <div className="text-[14px]">ราคาประเมินจาก AI (THB)</div>
                  <div className="font-medium text-[14px] text-right">100,000 THB</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 col-span-1 flex flex-col h-full">
                <div className="text-lg text-gray-600 mb-3 text-[18px]">Interest</div>
                <div className="flex items-center gap-2 justify-between">
                  <div className="text-[14px]">ดอกเบี้ย (ต่อปี)</div>
                  <div className="font-medium text-[14px] text-right">10%</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-between grid grid-cols-5">
              <div className="gap-[0.1rem]">
                <label className="block font-medium text-gray-700 mb-1 text-[16px]">Pawned price</label>
                <p className="text-gray-500 mb-1 text-[14px]">ราคาจำนำจริง(THB)</p>
              </div>
              <div className="flex gap-2 justify-end col-span-4">
                <input
                  type="text"
                  placeholder="ราคาจำนำจริง(THB)"
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-between grid grid-cols-5">
              <div className="gap-[0.1rem]">
                <label className="block font-medium text-gray-700 mb-1 text-[16px]">Period(3-30 days)</label>
                <p className="text-gray-500 mb-1 text-[14px]">ระยะเวลาจำนำ(3-30 วัน)</p>
              </div>
              <div className="flex gap-2 justify-end col-span-4">
                <input
                  type="text"
                  placeholder="ระยะเวลาจำนำ(3-30 วัน)"
                  className="w-full px-4 py-[0.5rem] text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Scrollable */}
        <div className="w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Calendar */}
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

          {/* Customer Information */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <h2 className="text-xl font-semibold">Customer information</h2>
              <TitleBadge text="ข้อมูลลูกค้า" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Full name</div>
                <div className="text-sm text-gray-500">
                  {getFullName() || 'ชื่อ - นามสกุล'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Phone number</div>
                <div className="text-sm text-gray-500">
                  {customerData.phoneNumber || 'Phone number'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">ID Number</div>
                <div className="text-sm text-gray-500">
                  {customerData.idNumber || 'เลขบัตรประชาชน'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Address</div>
                <div className="text-sm text-gray-500">
                  {getFullAddress() || 'ที่อยู่'}
                </div>
              </div>
            </div>
          </div>

          {/* Item Information Summary */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold mb-4">Item information</h2>
              <TitleBadge text="ข้อมูลของสินค้า" />
            </div>
            <p className="text-sm text-gray-500 mb-4">ข้อมูลของสินค้า</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Item</span>
                <span className="text-sm text-gray-800">
                  {getItemDescription() || 'ยี่ห้อ รุ่น ประเภท'}
                </span>
              </div>
              {itemData.serialNo && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Serial No.</span>
                  <span className="text-sm text-gray-800">{itemData.serialNo}</span>
                </div>
              )}
              {itemData.accessories && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accessories</span>
                  <span className="text-sm text-gray-800">{itemData.accessories}</span>
                </div>
              )}
              {itemData.condition !== '0' && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Condition</span>
                  <span className="text-sm text-gray-800">{itemData.condition}%</span>
                </div>
              )}
              {itemData.defects && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Defects</span>
                  <span className="text-sm text-gray-800">{itemData.defects}</span>
                </div>
              )}
              {itemData.note && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Note</span>
                  <span className="text-sm text-gray-800">{itemData.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleShowContractPreview}
            className="w-full bg-[#386337] text-[#F5F4F2] py-3 rounded-lg hover:bg-[#0A4215] hover:text-white transition-colors font-medium"
          >
            <span className="text-[18px] font-medium text-[#F5F4F2]">Preview & Create</span>
          </button>
        </div>
      </div>
      <ContractPreviewModal />
    </FixedLayout>
    </>
  );
}
