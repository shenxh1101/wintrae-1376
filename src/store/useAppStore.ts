import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Order, Client, Quote, OrderStatus, PaymentStatus, ProgressRecord, MonthlyStats } from '@/types';
import { mockOrders, mockClients, mockQuotes, mockMonthlyStats } from '@/data/mockData';
import { generateId } from '../utils';

const STORAGE_KEY = 'illustrator_app_store_v1';

interface PersistedState {
  orders: Order[];
  clients: Client[];
  quotes: Quote[];
  monthlyStats: MonthlyStats[];
}

const loadPersistedState = (): PersistedState | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return parsed as PersistedState;
    }
    return null;
  } catch (e) {
    console.warn('[store] Failed to load persisted state:', e);
    return null;
  }
};

const savePersistedState = (state: PersistedState): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[store] Failed to persist state:', e);
  }
};

const persisted = loadPersistedState();

interface AppState {
  orders: Order[];
  clients: Client[];
  quotes: Quote[];
  monthlyStats: MonthlyStats[];
  currentOrderFilter: OrderStatus | 'all';
  searchKeyword: string;

  setOrderFilter: (filter: OrderStatus | 'all') => void;
  setSearchKeyword: (keyword: string) => void;

  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, paidAmount?: number) => void;
  addProgressRecord: (orderId: string, record: Omit<ProgressRecord, 'id' | 'createdAt'>) => void;
  addDeliveryFile: (orderId: string, file: Omit<import('@/types').DeliveryFile, 'id' | 'uploadedAt'>) => void;

  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'orderCount' | 'totalRevenue'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;

  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;

  getFilteredOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  getClientById: (id: string) => Client | undefined;
  getOverdueOrders: () => Order[];
  getTotalRevenue: () => number;
  getPendingRevenue: () => number;

  resetToMockData: () => void;
}

const persist = (state: AppState) => {
  savePersistedState({
    orders: state.orders,
    clients: state.clients,
    quotes: state.quotes,
    monthlyStats: state.monthlyStats
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  orders: persisted?.orders || mockOrders,
  clients: persisted?.clients || mockClients,
  quotes: persisted?.quotes || mockQuotes,
  monthlyStats: persisted?.monthlyStats || mockMonthlyStats,
  currentOrderFilter: 'all',
  searchKeyword: '',

  setOrderFilter: (filter) => set({ currentOrderFilter: filter }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addOrder: (order) =>
    set((state) => {
      const newState = {
        orders: [
          {
            ...order,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          ...state.orders
        ]
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  updateOrder: (id, updates) =>
    set((state) => {
      const newState = {
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
        )
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  updateOrderStatus: (id, status) =>
    set((state) => {
      const progressMap: Record<OrderStatus, number> = {
        consultation: 10,
        draft: 25,
        lineart: 45,
        coloring: 70,
        revision: 85,
        delivered: 100
      };
      const newState = {
        orders: state.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                progress: progressMap[status],
                updatedAt: new Date().toISOString()
              }
            : o
        )
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  updatePaymentStatus: (id, status, paidAmount) =>
    set((state) => {
      const newState = {
        orders: state.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                paymentStatus: status,
                paidAmount: paidAmount ?? (status === 'paid' ? o.price : status === 'unpaid' ? 0 : o.paidAmount),
                updatedAt: new Date().toISOString()
              }
            : o
        )
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  addProgressRecord: (orderId, record) =>
    set((state) => {
      const newState = {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                progressRecords: [
                  ...o.progressRecords,
                  { ...record, id: generateId(), createdAt: new Date().toISOString() }
                ],
                revisionCount: record.revisionCount > 0 ? o.revisionCount + record.revisionCount : o.revisionCount,
                updatedAt: new Date().toISOString()
              }
            : o
        )
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  addDeliveryFile: (orderId, file) =>
    set((state) => {
      const newState = {
        orders: state.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                deliveryFiles: [
                  ...o.deliveryFiles,
                  { ...file, id: generateId(), uploadedAt: new Date().toISOString() }
                ],
                updatedAt: new Date().toISOString()
              }
            : o
        )
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  addClient: (client) =>
    set((state) => {
      const newState = {
        clients: [
          {
            ...client,
            id: generateId(),
            createdAt: new Date().toISOString(),
            orderCount: 0,
            totalRevenue: 0
          },
          ...state.clients
        ]
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  updateClient: (id, updates) =>
    set((state) => {
      const newState = {
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c))
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  addQuote: (quote) =>
    set((state) => {
      const newState = {
        quotes: [
          {
            ...quote,
            id: generateId(),
            createdAt: new Date().toISOString()
          },
          ...state.quotes
        ]
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  updateQuoteStatus: (id, status) =>
    set((state) => {
      const newState = {
        quotes: state.quotes.map((q) => (q.id === id ? { ...q, status } : q))
      };
      persist({ ...state, ...newState });
      return newState;
    }),

  getFilteredOrders: () => {
    const { orders, currentOrderFilter, searchKeyword } = get();
    let filtered = orders;
    if (currentOrderFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === currentOrderFilter);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(kw) ||
          o.clientName.toLowerCase().includes(kw) ||
          o.purpose.toLowerCase().includes(kw)
      );
    }
    return filtered;
  },

  getOrderById: (id) => get().orders.find((o) => o.id === id),
  getClientById: (id) => get().clients.find((c) => c.id === id),

  getOverdueOrders: () => {
    const { orders } = get();
    return orders.filter((o) => {
      if (o.status === 'delivered') return false;
      return new Date(o.deadline) < new Date();
    });
  },

  getTotalRevenue: () =>
    get().orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => sum + o.paidAmount, 0),

  getPendingRevenue: () =>
    get().orders.reduce((sum, o) => sum + (o.price - o.paidAmount), 0),

  resetToMockData: () =>
    set(() => {
      const newState = {
        orders: mockOrders,
        clients: mockClients,
        quotes: mockQuotes,
        monthlyStats: mockMonthlyStats
      };
      Taro.removeStorageSync(STORAGE_KEY);
      return newState;
    })
}));
