export interface Contract {
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

// Mutable contracts data that can be updated
export let contractsData: Contract[] = [
  {
    id: '1',
    contractNumber: 'BCOK87CAKZ05',
    customer: {
      name: 'Customer 1',
      phone: '0812345678',
      idNumber: '1234567890123',
      address: '123 Main Street, Bangkok, Thailand, 10100'
    },
    item: {
      brand: 'Apple',
      model: 'MacBook Air M3',
      type: 'Laptop',
      serialNo: 'MBA2024001',
      accessories: 'Charger, Box, Manual',
      condition: 90,
      defects: 'Minor scratches on lid',
      note: 'Well-maintained laptop',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 15000,
      pawnedPrice: 12300,
      interestRate: 3.0,
      periodDays: 30
    },
    dates: {
      startDate: '2024-12-01',
      dueDate: '2025-07-09'
    },
    status: 'overdue',
    transactionHistory: [
      {
        id: '1',
        type: 'interest_payment',
        amount: 369,
        paymentMethod: 'cash',
        date: '2024-12-15',
        note: 'Monthly interest payment'
      },
      {
        id: '2',
        type: 'principal_increase',
        amount: 2000,
        paymentMethod: 'bank_transfer',
        date: '2024-12-20',
        note: 'Additional loan amount requested'
      }
    ]
  },
  {
    id: '2',
    contractNumber: '6UIT5SZ3H0CJ',
    customer: {
      name: 'Customer 2',
      phone: '0987654321',
      idNumber: '9876543210987',
      address: '456 Second Avenue, Bangkok, Thailand, 10200'
    },
    item: {
      brand: 'Apple',
      model: 'IdeaPad Slim 7',
      type: 'Laptop',
      serialNo: 'IPS2024002',
      accessories: 'Charger, Box',
      condition: 85,
      defects: 'None reported',
      note: 'Good condition',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 16000,
      pawnedPrice: 14000,
      interestRate: 3.0,
      periodDays: 30
    },
    dates: {
      startDate: '2024-11-15',
      dueDate: '2025-07-09'
    },
    status: 'overdue',
    transactionHistory: [
      {
        id: '3',
        type: 'interest_payment',
        amount: 420,
        paymentMethod: 'promptpay',
        date: '2024-11-30',
        note: 'Interest payment via PromptPay'
      }
    ]
  },
  {
    id: '3',
    contractNumber: '5LX7053KG8HR',
    customer: {
      name: 'Customer 3',
      phone: '0856789123',
      idNumber: '5555666677778',
      address: '789 Third Road, Bangkok, Thailand, 10300'
    },
    item: {
      brand: 'ASUS',
      model: 'ROG Ally',
      type: 'Gaming Device',
      serialNo: 'ROG2024003',
      accessories: 'Charger, Carrying Case',
      condition: 95,
      defects: 'None',
      note: 'Like new condition',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 12000,
      pawnedPrice: 10000,
      interestRate: 3.5,
      periodDays: 30
    },
    dates: {
      startDate: '2024-12-01',
      dueDate: '2025-07-09'
    },
    status: 'overdue',
    transactionHistory: []
  },
  {
    id: '4',
    contractNumber: '4U98RYSISFG0',
    customer: {
      name: 'Customer 4',
      phone: '0823456789',
      idNumber: '4444333322221',
      address: '321 Fourth Street, Bangkok, Thailand, 10400'
    },
    item: {
      brand: 'Apple',
      model: 'Apple TV 4K',
      type: 'Streaming Device',
      serialNo: 'ATV2024004',
      accessories: 'Remote, HDMI Cable, Box',
      condition: 88,
      defects: 'Minor wear on remote',
      note: 'Fully functional',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 6000,
      pawnedPrice: 5000,
      interestRate: 2.0,
      periodDays: 30
    },
    dates: {
      startDate: '2024-10-15',
      dueDate: '2025-07-08'
    },
    status: 'overdue',
    transactionHistory: []
  },
  {
    id: '5',
    contractNumber: 'EUPLGECL3NRE',
    customer: {
      name: 'Customer 5',
      phone: '0867891234',
      idNumber: '7777888899990',
      address: '654 Fifth Lane, Bangkok, Thailand, 10500'
    },
    item: {
      brand: 'Apple',
      model: 'iPad Air 5th Gen',
      type: 'Tablet',
      serialNo: 'IPA2024005',
      accessories: 'Charger, Apple Pencil, Smart Keyboard',
      condition: 92,
      defects: 'Small scratch on screen',
      note: 'Includes premium accessories',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 13000,
      pawnedPrice: 11000,
      interestRate: 4.0,
      periodDays: 30
    },
    dates: {
      startDate: '2024-09-01',
      dueDate: '2025-07-09'
    },
    status: 'overdue',
    transactionHistory: []
  },
  {
    id: '6',
    contractNumber: 'JIT9PERGCJNY',
    customer: {
      name: 'Customer 6',
      phone: '0834567890',
      idNumber: '6666777788889',
      address: '987 Sixth Plaza, Bangkok, Thailand, 10600'
    },
    item: {
      brand: 'Apple',
      model: 'iPad Air 5th Gen',
      type: 'Tablet',
      serialNo: 'IPA2024006',
      accessories: 'Charger, Case, Screen Protector',
      condition: 89,
      defects: 'None reported',
      note: 'Well protected with case',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 17000,
      pawnedPrice: 15000,
      interestRate: 3.0,
      periodDays: 30
    },
    dates: {
      startDate: '2024-11-01',
      dueDate: '2025-07-09'
    },
    status: 'overdue',
    transactionHistory: []
  },
  {
    id: '7',
    contractNumber: 'BSY5NF7MLPC5',
    customer: {
      name: 'Customer 7',
      phone: '0845678901',
      idNumber: '8888999900001',
      address: '147 Seventh Circle, Bangkok, Thailand, 10700'
    },
    item: {
      brand: 'Samsung',
      model: 'Galaxy Tab S9',
      type: 'Tablet',
      serialNo: 'GTS2024007',
      accessories: 'S Pen, Charger, Keyboard Cover',
      condition: 87,
      defects: 'Light scratches on back',
      note: 'Productivity setup included',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 12000,
      pawnedPrice: 10000,
      interestRate: 2.5,
      periodDays: 30
    },
    dates: {
      startDate: '2024-10-15',
      dueDate: '2025-06-09'
    },
    status: 'overdue',
    transactionHistory: []
  },
  {
    id: '8',
    contractNumber: 'NXGQ0HSBQEDP',
    customer: {
      name: 'Customer 8',
      phone: '0856789012',
      idNumber: '9999000011112',
      address: '258 Eighth Avenue, Bangkok, Thailand, 10800'
    },
    item: {
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      type: 'Smartphone',
      serialNo: 'IPM2024008',
      accessories: 'Charger, Case, Screen Protector',
      condition: 96,
      defects: 'None',
      note: 'Almost new condition',
      images: []
    },
    pawnDetails: {
      aiEstimatedPrice: 6000,
      pawnedPrice: 5000,
      interestRate: 3.5,
      periodDays: 30
    },
    dates: {
      startDate: '2024-09-01',
      dueDate: '2025-28/08'
    },
    status: 'sold',
    transactionHistory: []
  }
];

// Function to update a contract in the shared data
export const updateContract = (contractId: string, updatedContract: Contract) => {
  const index = contractsData.findIndex(contract => contract.id === contractId);
  if (index !== -1) {
    contractsData[index] = updatedContract;
    console.log('Contract updated in shared data:', updatedContract.contractNumber);
  }
};

// Function to add transaction to a contract
export const addTransactionToContract = (contractId: string, transaction: Contract['transactionHistory'][0]) => {
  const index = contractsData.findIndex(contract => contract.id === contractId);
  if (index !== -1) {
    contractsData[index].transactionHistory.push(transaction);
    console.log('Transaction added to contract:', contractsData[index].contractNumber);
  }
};