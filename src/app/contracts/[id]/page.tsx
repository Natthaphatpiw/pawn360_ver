'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FixedLayout from '@/components/layout/FixedLayout';
import { Sarabun } from 'next/font/google';
const sarabun = Sarabun({
  subsets: ['latin','thai'],
  weight: ['400', '500', '600', '700'],
});
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
  _id: string;
  contractNumber: string;
  customerId: string;
  customer: {
    fullName: string;
    phone: string;
    idNumber: string;
    address: string;
  };
  pawnDetails: {
    pawnedPrice: number;
    interestRate: number;
    totalInterest: number;
    remainingAmount: number;
    aiEstimatedPrice: number;
    periodDays: number;
  };
  item: {
    brand: string;
    model: string;
    type: string;
    serialNumber: string;
    description: string;
    condition: number;
    defects?: string;
    note?: string;
    accessories?: string;
    images: string[];
  };
  dates: {
    contractDate: string;
    dueDate: string;
    redeemDate?: string;
    suspendedDate?: string;
  };
  status: string;
  transactionHistory: Array<{
    _id: string;
    type: string;
    amount: number;
    paymentMethod?: string;
    createdAt: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}


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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const contractId = Array.isArray(params.id) ? params.id[0] : params.id;

        const response = await fetch(`/api/contracts/${contractId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contract');
        }

        const data = await response.json();
        setContract(data);
      } catch (err) {
        console.error('Error fetching contract:', err);
        setError('Failed to load contract');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [params.id]);

  const TitleBadge = ({ text }: { text: string }) => (
    <div className={`bg-[#CAC8C8] text-gray-600 text-[12px] font-normal px-2 py-0.5 rounded-md ${sarabun.className}`}>
      {text}
    </div>
  );

  if (loading) {
    return (
      <FixedLayout>
        <div className={`flex items-center justify-center h-64 ${sarabun.className}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#487C47] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading contract...</p>
          </div>
        </div>
      </FixedLayout>
    );
  }

  if (error || !contract) {
    return (
      <FixedLayout>
        <div className={`flex items-center justify-center h-64 ${sarabun.className}`}>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Contract not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#487C47] text-white rounded-lg hover:bg-[#386337]"
            >
              Go Back
            </button>
          </div>
        </div>
      </FixedLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
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
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
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

  const handleModalSubmit = async () => {
    if (!contract) return;

    try {
      // Prepare action data
      const actionData = {
        type: activeModal,
        amount: modalData.amount ? parseInt(modalData.amount) : (activeModal === 'redeem' ? calculateTotal() : calculateInterest()),
        paymentMethod: modalData.paymentMethod,
        note: modalData.note,
        reason: modalData.reason,
        processedBy: '68db577210012d2296d0579f', // Mock user ID - in real app, get from auth context
        extensionDays: modalData.extensionDays || 30
      };

      // Call the API to process the action
      const response = await fetch(`/api/contracts/${contract._id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        throw new Error('Failed to process action');
      }

      // Refresh the contract data
      const contractResponse = await fetch(`/api/contracts/${contract._id}`);
      if (!contractResponse.ok) {
        throw new Error('Failed to refresh contract data');
      }

      const updatedContract = await contractResponse.json();
      setContract(updatedContract);

      setActiveModal(null);
      setModalData({});
    } catch (err) {
      console.error('Error processing action:', err);
      setError('Failed to process action');
    }
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
    <FixedLayout>
      <div className={`flex h-full gap-1 ${sarabun.className}`}>
        {/* Left Panel - Scrollable */}
        <div className="w-2/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Header */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-gray-600 hover:text-[#487C47] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  <h1 className="text-xl font-semibold">Contract Details</h1>
                  <TitleBadge text="รายละเอียดสัญญา" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(contract.status)}
                <button className="p-2 text-gray-600 hover:text-[#487C47] hover:bg-gray-100 rounded-lg transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-gray-500 font-mono text-sm">{contract.contractNumber}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User size={20} className="text-[#487C47]" />
                Customer Information
              </h2>
              <TitleBadge text="ข้อมูลลูกค้า" />
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <div className="text-gray-900 font-medium">{contract.customer.fullName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <div className="text-gray-900 flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      {contract.customer.phone}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ID Number</label>
                    <div className="text-gray-900 font-mono">{contract.customer.idNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <div className="text-gray-900 flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <span>{contract.customer.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Item Information */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package size={20} className="text-[#487C47]" />
                Item Information
              </h2>
              <TitleBadge text="ข้อมูลสินค้า" />
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Brand & Model</label>
                    <div className="text-gray-900 font-medium">{contract.item.brand} {contract.item.model}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="text-gray-900">{contract.item.type}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Serial Number</label>
                    <div className="text-gray-900 font-mono">{contract.item.serialNumber}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Accessories</label>
                    <div className="text-gray-900">{contract.item.accessories}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Condition</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#487C47] h-2 rounded-full transition-all"
                          style={{ width: `${contract.item.condition}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium">{contract.item.condition}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Defects</label>
                    <div className="text-gray-900">{contract.item.defects || 'None reported'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Note</label>
                    <div className="text-gray-900">{contract.item.note || 'No additional notes'}</div>
                  </div>
                </div>
              </div>

              {/* Item Images */}
              {contract.item.images.length > 0 && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-600 mb-3 block">Item Images</label>
                  <div className="grid grid-cols-3 gap-4">
                    {contract.item.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Package size={32} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-[#F5F4F2] rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock size={20} className="text-[#487C47]" />
                Transaction History
              </h2>
              <TitleBadge text="ประวัติการทำรายการ" />
            </div>
            <div className="bg-white rounded-lg p-4">
              {contract.transactionHistory.length > 0 ? (
                <div className="space-y-3">
                  {contract.transactionHistory
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((transaction) => (
                    <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#487C47] rounded-full flex items-center justify-center">
                          <DollarSign size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)} • {transaction.paymentMethod || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(transaction.amount)} THB</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Scrollable */}
        <div className="w-1/3 p-1 h-full flex flex-col gap-3 overflow-y-auto max-h-full">
          {/* Loan Summary */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign size={20} className="text-[#487C47]" />
                Loan Summary
              </h3>
              <TitleBadge text="สรุปเงินกู้" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">AI Estimated Price:</span>
                <span className="font-medium text-gray-900">{formatCurrency(contract.pawnDetails.aiEstimatedPrice)} THB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Principal Amount:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(contract.pawnDetails.pawnedPrice)} THB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Interest Rate:</span>
                <span className="font-medium text-gray-900">{contract.pawnDetails.interestRate}% per month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium text-gray-900">{contract.pawnDetails.periodDays} days</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Interest Amount:</span>
                  <span className="font-medium text-orange-600">{formatCurrency(calculateInterest())} THB</span>
                </div>
                <div className="flex justify-between items-center text-lg mt-2">
                  <span className="font-semibold text-gray-900">Total Repayment:</span>
                  <span className="font-bold text-[#487C47]">{formatCurrency(calculateTotal())} THB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar size={20} className="text-[#487C47]" />
                Important Dates
              </h3>
              <TitleBadge text="วันที่สำคัญ" />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Contract Date</label>
                <div className="text-gray-900">{formatDate(contract.dates.contractDate)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Due Date</label>
                <div className="text-gray-900">{formatDate(contract.dates.dueDate)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Days Remaining</label>
                <div className="text-gray-900">
                  {Math.ceil((new Date(contract.dates.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-1 mb-4">
              <h3 className="text-xl font-semibold">Actions</h3>
              <TitleBadge text="การจัดการ" />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleAction('redeem')}
                className="w-full px-4 py-3 bg-[#487C47] text-white rounded-lg hover:bg-[#386337] transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                Redeem
              </button>
              <button
                onClick={() => handleAction('pay_interest')}
                className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Pay Interest
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('decrease_loan')}
                  className="px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Minus size={16} />
                  Decrease
                </button>
                <button
                  onClick={() => handleAction('increase_loan')}
                  className="px-4 py-3 border border-[#487C47] text-[#487C47] rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Increase
                </button>
              </div>
              <button
                onClick={() => handleAction('suspend')}
                className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Pause size={16} />
                Suspend
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderActionModal()}
    </FixedLayout>
  );
}