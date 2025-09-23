'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { 
  ArrowLeft, 
  User, 
  Package, 
  DollarSign, 
  Calendar, 
  Phone, 
  MapPin,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Download,
  Eye,
  X
} from 'lucide-react';

interface Contract {
  id: string;
  contractNumber: string;
  customer: {
    name: string;
    phone: string;
    idNumber: string;
    address: string;
  };
  item: {
    brand: string;
    model: string;
    type: string;
    serialNo: string;
    accessories: string;
    condition: number;
    defects: string;
    note: string;
    images: string[];
  };
  pawnDetails: {
    aiEstimatedPrice: number;
    pawnedPrice: number;
    interestRate: number;
    periodDays: number;
  };
  dates: {
    startDate: string;
    dueDate: string;
  };
  status: 'active' | 'overdue' | 'redeemed' | 'suspended' | 'sold';
  transactionHistory: {
    id: string;
    type: 'interest_payment' | 'principal_increase' | 'principal_decrease' | 'redeem' | 'suspend';
    amount: number;
    paymentMethod?: string;
    date: string;
    note?: string;
  }[];
}

// Mock contract data matching screenshot
const mockContract: Contract = {
  id: '2',
  contractNumber: '6UIT5SZ3H0CJ',
  customer: {
    name: 'Alex Wilson',
    phone: '0822222222',
    idNumber: '8888888888888',
    address: '130/26, , ปลองีบน536, ดิทยุ, คลองกีู, กรุงเทพ, ไทย, 11100'
  },
  item: {
    brand: 'Lenovo',
    model: 'IdeaPad Slim 7',
    type: 'Laptop',
    serialNo: '43154316',
    accessories: 'Standard accessories',
    condition: 85,
    defects: 'None',
    note: 'Demo contract',
    images: []
  },
  pawnDetails: {
    aiEstimatedPrice: 14000,
    pawnedPrice: 14000,
    interestRate: 3.0,
    periodDays: 7
  },
  dates: {
    startDate: '2025-08-31',
    dueDate: '2025-09-07'
  },
  status: 'overdue',
  transactionHistory: []
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-l-grey-2">
          <h3 className="text-lg font-semibold text-d-grey-5">{title}</h3>
          <button
            onClick={onClose}
            className="text-clay-grey hover:text-semantic-red transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});

  useEffect(() => {
    // In a real app, fetch contract data based on params.id
    setContract(mockContract);
  }, [params.id]);

  if (!contract) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leaf-green"></div>
        </div>
      </AppLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2, label: 'Active' },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Pause, label: 'Suspended' },
      sold: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: 'Sold' },
      redeemed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle2, label: 'Redeemed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon size={16} />
        {config.label}
      </span>
    );
  };

  const calculateInterest = () => {
    const principal = contract.pawnDetails.pawnedPrice;
    const rate = contract.pawnDetails.interestRate / 100;
    const days = contract.pawnDetails.periodDays;
    return Math.round(principal * rate * (days / 30));
  };

  const calculateTotal = () => {
    return contract.pawnDetails.pawnedPrice + calculateInterest();
  };

  const handleAction = (action: string) => {
    setActiveModal(action);
    setModalData({});
  };

  const handleModalSubmit = () => {
    // Handle the action based on activeModal type
    console.log('Action:', activeModal, 'Data:', modalData);
    setActiveModal(null);
    setModalData({});
  };

  const renderActionModal = () => {
    switch (activeModal) {
      case 'redeem':
        return (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Redeem Contract"
          >
            <div className="space-y-4">
              <div className="bg-l-grey-1 rounded-lg p-4">
                <div className="text-sm text-clay-grey">Total Amount to Pay</div>
                <div className="text-2xl font-bold text-leaf-green">{formatCurrency(calculateTotal())}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Payment Method</label>
                <select 
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  value={modalData.paymentMethod || ''}
                  onChange={(e) => setModalData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="promptpay">PromptPay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Note (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  rows={3}
                  placeholder="Add any notes..."
                  value={modalData.note || ''}
                  onChange={(e) => setModalData(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-3 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Complete Redemption
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'pay_interest':
        return (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Pay Interest"
          >
            <div className="space-y-4">
              <div className="bg-l-grey-1 rounded-lg p-4">
                <div className="text-sm text-clay-grey">Interest Amount</div>
                <div className="text-2xl font-bold text-semantic-orange">{formatCurrency(calculateInterest())}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Payment Method</label>
                <select 
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  value={modalData.paymentMethod || ''}
                  onChange={(e) => setModalData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="promptpay">PromptPay</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-3 bg-semantic-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'increase_loan':
        return (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Increase Loan Amount"
          >
            <div className="space-y-4">
              <div className="bg-l-grey-1 rounded-lg p-4">
                <div className="text-sm text-clay-grey">Current Principal</div>
                <div className="text-xl font-bold text-d-grey-5">{formatCurrency(contract.pawnDetails.pawnedPrice)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Additional Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter additional amount"
                    value={modalData.amount || ''}
                    onChange={(e) => setModalData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-clay-grey">฿</div>
                </div>
              </div>

              {modalData.amount && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-clay-grey">New Principal Amount</div>
                  <div className="text-xl font-bold text-leaf-green">
                    {formatCurrency(contract.pawnDetails.pawnedPrice + parseInt(modalData.amount || 0))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-3 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Increase Loan
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'decrease_loan':
        return (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Decrease Loan Amount"
          >
            <div className="space-y-4">
              <div className="bg-l-grey-1 rounded-lg p-4">
                <div className="text-sm text-clay-grey">Current Principal</div>
                <div className="text-xl font-bold text-d-grey-5">{formatCurrency(contract.pawnDetails.pawnedPrice)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Reduction Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                    placeholder="Enter reduction amount"
                    max={contract.pawnDetails.pawnedPrice}
                    value={modalData.amount || ''}
                    onChange={(e) => setModalData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-clay-grey">฿</div>
                </div>
              </div>

              {modalData.amount && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-clay-grey">New Principal Amount</div>
                  <div className="text-xl font-bold text-navy-blue">
                    {formatCurrency(Math.max(0, contract.pawnDetails.pawnedPrice - parseInt(modalData.amount || 0)))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-3 bg-navy-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Decrease Loan
                </button>
              </div>
            </div>
          </Modal>
        );

      case 'suspend':
        return (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Suspend Contract"
          >
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <AlertTriangle size={20} />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-orange-600 text-sm">
                  Suspending this contract will pause all interest calculations and mark it as inactive.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Reason for Suspension</label>
                <select 
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  value={modalData.reason || ''}
                  onChange={(e) => setModalData(prev => ({ ...prev, reason: e.target.value }))}
                >
                  <option value="">Select reason</option>
                  <option value="payment_overdue">Payment Overdue</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="item_damage">Item Damage</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-clay-grey mb-2">Additional Notes</label>
                <textarea 
                  className="w-full px-4 py-3 border border-l-grey-4 rounded-lg form-input"
                  rows={3}
                  placeholder="Provide additional details..."
                  value={modalData.note || ''}
                  onChange={(e) => setModalData(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveModal(null)}
                  className="flex-1 px-4 py-3 border border-l-grey-4 text-clay-grey rounded-lg hover:bg-l-grey-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  className="flex-1 px-4 py-3 bg-semantic-red text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Suspend Contract
                </button>
              </div>
            </div>
          </Modal>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-clay-grey hover:text-leaf-green hover:bg-l-grey-1 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-d-grey-5">Contract Details</h1>
              <p className="text-clay-grey font-mono">{contract.contractNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(contract.status)}
            <button className="p-2 text-clay-grey hover:text-leaf-green hover:bg-l-grey-1 rounded-lg transition-colors">
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h2 className="text-lg font-semibold text-d-grey-5 mb-4 flex items-center gap-2">
                <User size={20} className="text-leaf-green" />
                Customer Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Full Name</label>
                    <div className="text-d-grey-5 font-medium">{contract.customer.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Phone Number</label>
                    <div className="text-d-grey-5 flex items-center gap-2">
                      <Phone size={16} className="text-clay-grey" />
                      {contract.customer.phone}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-clay-grey">ID Number</label>
                    <div className="text-d-grey-5 font-mono">{contract.customer.idNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Address</label>
                    <div className="text-d-grey-5 flex items-start gap-2">
                      <MapPin size={16} className="text-clay-grey mt-1 flex-shrink-0" />
                      <span>{contract.customer.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Information */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h2 className="text-lg font-semibold text-d-grey-5 mb-4 flex items-center gap-2">
                <Package size={20} className="text-leaf-green" />
                Item Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Brand & Model</label>
                    <div className="text-d-grey-5 font-medium">{contract.item.brand} {contract.item.model}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Type</label>
                    <div className="text-d-grey-5">{contract.item.type}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Serial Number</label>
                    <div className="text-d-grey-5 font-mono">{contract.item.serialNo}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Accessories</label>
                    <div className="text-d-grey-5">{contract.item.accessories}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Condition</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-l-grey-3 rounded-full h-2">
                        <div 
                          className="bg-leaf-green h-2 rounded-full transition-all"
                          style={{ width: `${contract.item.condition}%` }}
                        ></div>
                      </div>
                      <span className="text-d-grey-5 font-medium">{contract.item.condition}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Defects</label>
                    <div className="text-d-grey-5">{contract.item.defects || 'None reported'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-clay-grey">Note</label>
                    <div className="text-d-grey-5">{contract.item.note || 'No additional notes'}</div>
                  </div>
                </div>
              </div>

              {/* Item Images */}
              {contract.item.images.length > 0 && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-clay-grey mb-3 block">Item Images</label>
                  <div className="grid grid-cols-3 gap-4">
                    {contract.item.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-l-grey-1 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-l-grey-2 to-l-grey-3 flex items-center justify-center">
                          <Package size={32} className="text-clay-grey" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h2 className="text-lg font-semibold text-d-grey-5 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-leaf-green" />
                Transaction History
              </h2>
              {contract.transactionHistory.length > 0 ? (
                <div className="space-y-3">
                  {contract.transactionHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-l-grey-1 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-leaf-green rounded-full flex items-center justify-center">
                          <DollarSign size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-d-grey-5">
                            {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-clay-grey">
                            {formatDate(transaction.date)} • {transaction.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-d-grey-5">{formatCurrency(transaction.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-clay-grey">
                  <Clock size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loan Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h3 className="text-lg font-semibold text-d-grey-5 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-leaf-green" />
                Loan Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-clay-grey">AI Estimated Price:</span>
                  <span className="font-medium text-d-grey-5">{formatCurrency(contract.pawnDetails.aiEstimatedPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-clay-grey">Principal Amount:</span>
                  <span className="font-semibold text-d-grey-5">{formatCurrency(contract.pawnDetails.pawnedPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-clay-grey">Interest Rate:</span>
                  <span className="font-medium text-d-grey-5">{contract.pawnDetails.interestRate}% per month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-clay-grey">Period:</span>
                  <span className="font-medium text-d-grey-5">{contract.pawnDetails.periodDays} days</span>
                </div>
                <div className="border-t border-l-grey-2 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-clay-grey">Interest Amount:</span>
                    <span className="font-medium text-semantic-orange">{formatCurrency(calculateInterest())}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-2">
                    <span className="font-semibold text-d-grey-5">Total Repayment:</span>
                    <span className="font-bold text-leaf-green">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h3 className="text-lg font-semibold text-d-grey-5 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-leaf-green" />
                Important Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-clay-grey">Start Date</label>
                  <div className="text-d-grey-5">{formatDate(contract.dates.startDate)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-clay-grey">Due Date</label>
                  <div className="text-d-grey-5">{formatDate(contract.dates.dueDate)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-clay-grey">Days Remaining</label>
                  <div className="text-d-grey-5">
                    {Math.ceil((new Date(contract.dates.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-l-grey-2 p-6">
              <h3 className="text-lg font-semibold text-d-grey-5 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('redeem')}
                  className="w-full px-4 py-3 bg-leaf-green text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Redeem
                </button>
                <button
                  onClick={() => handleAction('pay_interest')}
                  className="w-full px-4 py-3 bg-semantic-orange text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay Interest
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction('decrease_loan')}
                    className="px-4 py-3 border border-navy-blue text-navy-blue rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Minus size={16} />
                    Decrease Loan
                  </button>
                  <button
                    onClick={() => handleAction('increase_loan')}
                    className="px-4 py-3 border border-leaf-green text-leaf-green rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Increase Loan
                  </button>
                </div>
                <button
                  onClick={() => handleAction('suspend')}
                  className="w-full px-4 py-3 bg-semantic-red text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Pause size={16} />
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>

        {renderActionModal()}
      </div>
    </AppLayout>
  );
}