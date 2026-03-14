export const mockUser = {
  id: '1',
  name: 'Alex Trader',
  email: 'trader@primetrade.ai',
  role: 'USER'
};

export const mockAdmin = {
  id: '2',
  name: 'Prime Admin',
  email: 'admin@primetrade.ai',
  role: 'ADMIN'
};

export const mockTrades = [
  {
    id: '1',
    coin: 'BTC',
    type: 'BUY',
    amount: 0.5,
    price: 67000,
    totalValue: 33500,
    status: 'OPEN',
    notes: 'Long term hold',
    createdAt: '2024-01-15',
    userId: '1'
  },
  {
    id: '2',
    coin: 'ETH',
    type: 'BUY',
    amount: 3,
    price: 3500,
    totalValue: 10500,
    status: 'OPEN',
    notes: 'DeFi play',
    createdAt: '2024-01-18',
    userId: '1'
  },
  {
    id: '3',
    coin: 'SOL',
    type: 'SELL',
    amount: 20,
    price: 180,
    totalValue: 3600,
    status: 'CLOSED',
    notes: 'Taking profits',
    createdAt: '2024-01-20',
    userId: '1'
  },
  {
    id: '4',
    coin: 'BNB',
    type: 'BUY',
    amount: 10,
    price: 420,
    totalValue: 4200,
    status: 'OPEN',
    notes: '',
    createdAt: '2024-01-22',
    userId: '1'
  },
  {
    id: '5',
    coin: 'ETH',
    type: 'SELL',
    amount: 1,
    price: 3800,
    totalValue: 3800,
    status: 'CLOSED',
    notes: 'Swing trade exit',
    createdAt: '2024-01-25',
    userId: '1'
  },
  {
    id: '6',
    coin: 'BTC',
    type: 'BUY',
    amount: 0.2,
    price: 65000,
    totalValue: 13000,
    status: 'OPEN',
    notes: 'DCA entry',
    createdAt: '2024-01-28',
    userId: '1'
  },
  {
    id: '7',
    coin: 'AVAX',
    type: 'BUY',
    amount: 50,
    price: 38,
    totalValue: 1900,
    status: 'CANCELLED',
    notes: 'Order cancelled',
    createdAt: '2024-02-01',
    userId: '1'
  },
  {
    id: '8',
    coin: 'SOL',
    type: 'BUY',
    amount: 15,
    price: 195,
    totalValue: 2925,
    status: 'OPEN',
    notes: '',
    createdAt: '2024-02-03',
    userId: '1'
  }
];

export const mockUsers = [
  {
    id: '1',
    name: 'Alex Trader',
    email: 'trader@primetrade.ai',
    role: 'USER',
    tradeCount: 8,
    portfolioValue: 65825,
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    name: 'Prime Admin',
    email: 'admin@primetrade.ai',
    role: 'ADMIN',
    tradeCount: 0,
    portfolioValue: 0,
    createdAt: '2024-01-01'
  },
  {
    id: '3',
    name: 'Sarah Moon',
    email: 'sarah@example.com',
    role: 'USER',
    tradeCount: 5,
    portfolioValue: 28400,
    createdAt: '2024-01-12'
  },
  {
    id: '4',
    name: 'Raj Crypto',
    email: 'raj@example.com',
    role: 'USER',
    tradeCount: 12,
    portfolioValue: 92100,
    createdAt: '2024-01-14'
  }
];

