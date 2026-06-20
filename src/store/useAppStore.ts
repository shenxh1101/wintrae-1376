import { create } from 'zustand';
import Taro from '@tarojs/taro';
import {
  Order,
  Client,
  Quote,
  OrderStatus,
  PaymentStatus,
  ProgressRecord,
  MonthlyStats,
  DeliveryFile
} from '@/types';
import { mockOrders, mockClients, mockQuotes } from '@/data/mockData';
import { generateId } from '../utils';
import dayjs from 'dayjs';

const STORAGE_KEY = 'illustrator_app_store_v2';

interface PersistedState {
  orders: Order[];
  clients: Client[];
  quotes: Quote[];
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

const getMonthKey = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM');
};

const computeMonthlyStats = (orders: Order[]): MonthlyStats[] => {
  const monthMap: Record<string, MonthlyStats> = {};
  const now = dayjs();

  for (let i = 5; i >= 0; i--) {
    const d = now.subtract(i, 'month');
    const key = d.format('YYYY-MM');
    const label = d.format('M月');
    monthMap[key] = { month: label, revenue: 0, orderCount: 0 };
  }

  orders.forEach((o) => {
    if (o.status === 'delivered' && o.paidAmount > 0) {
      const key = getMonthKey(o.updatedAt);
      if (monthMap[key]) {
        monthMap[key].revenue += o.paidAmount;
        monthMap[key].orderCount += 1;
      } else {
        const label = dayjs(o.updatedAt).format('M月');
        monthMap[key] = { month: label, revenue: o.paidAmount, orderCount: 1 };
      }
    }
  });

  return Object.values(monthMap).sort((a, b) => {
    return dayjs(a.month, 'M月').valueOf() - dayjs(b.month, 'M月').valueOf();
  }).slice(-6);
};

interface AppState {
  orders: Order[];
  clients: Client[];
  quotes: Quote[];
  currentOrderFilter: OrderStatus | 'all';
  searchKeyword: string;

  setOrderFilter: (filter: OrderStatus | 'all') => void;
  setSearchKeyword: (keyword: string) => void;

  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, paidAmount?: number) => void;
  addProgressRecord: (orderId: string, record: Omit<ProgressRecord, 'id' | 'createdAt'>) => void;
  addDeliveryFile: (orderId: string, file: Omit<DeliveryFile, 'id' | 'uploadedAt'>) => void;

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
  getMonthlyStats: () => MonthlyStats[];
  getDeliveredFiles: (filters?: { clientId?: string; orderId?: string }) => (DeliveryFile & {
    orderId: string;
    orderTitle: string;
    clientId: string;
    clientName: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    paidAmount: number;
    orderPrice: number;
  })[];
  getAvgOrderValue: () => number;
  getStatusCounts: () => Record<OrderStatus, number> & { all: number };

  resetToMockData: () => void;
}

const persist = (state: AppState) => {
  savePersistedState({
    orders: state.orders,
    clients: state.clients,
    quotes: state.quotes
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  orders: persisted?.orders || mockOrders,
  clients: persisted?.clients || mockClients,
  quotes: persisted?.quotes || mockQuotes,
  currentOrderFilter: 'all',
  searchKeyword: '',

  setOrderFilter: (filter) => set({ currentOrderFilter: filter }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addOrder: (order) =>
    set((state) => {
      const newOrder: Order = {
        ...order,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const newState = { orders: [newOrder, ...state.orders] };

      if (newOrder.clientId && !newOrder.clientId.startsWith('temp-')) {
        const client = state.clients.find((c) => c.id === newOrder.clientId);
        if (client) {
          newState.clients = state.clients.map((c) =>
            c.id === newOrder.clientId
              ? { ...c, orderCount: c.orderCount + 1 }
              : c
          );
        }
      }

      persist({ ...state, ...newState });
      return newState;
    }),

  updateOrder: (id, updates) =>
    set((state) => {
      const oldOrder = state.orders.find((o) => o.id === id);
      const newState = {
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
        )
      };

      if (updates.price !== undefined && oldOrder) {
        const priceDiff = updates.price - oldOrder.price;
        if (oldOrder.status === 'delivered' && oldOrder.clientId && !oldOrder.clientId.startsWith('temp-')) {
          newState.clients = state.clients.map((c) =>
            c.id === oldOrder.clientId
              ? { ...c, totalRevenue: Math.max(0, c.totalRevenue + priceDiff) }
              : c
          );
        }
      }

      persist({ ...state, ...newState });
      return newState;
    }),

  updateOrderStatus: (id, status) =>
    set((state) => {
      const oldOrder = state.orders.find((o) => o.id === id);
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

      if (oldOrder && oldOrder.status !== 'delivered' && status === 'delivered') {
        if (oldOrder.clientId && !oldOrder.clientId.startsWith('temp-')) {
          newState.clients = state.clients.map((c) =>
            c.id === oldOrder.clientId
              ? { ...c, totalRevenue: c.totalRevenue + oldOrder.paidAmount }
              : c
          );
        }
      } else if (oldOrder && oldOrder.status === 'delivered' && status !== 'delivered') {
        if (oldOrder.clientId && !oldOrder.clientId.startsWith('temp-')) {
          newState.clients = state.clients.map((c) =>
            c.id === oldOrder.clientId
              ? { ...c, totalRevenue: Math.max(0, c.totalRevenue - oldOrder.paidAmount) }
              : c
          );
        }
      }

      persist({ ...state, ...newState });
      return newState;
    }),

  updatePaymentStatus: (id, status, paidAmount) =>
    set((state) => {
      const oldOrder = state.orders.find((o) => o.id === id);
      const newPaid = paidAmount ?? (status === 'paid' ? (oldOrder?.price || 0) : status === 'unpaid' ? 0 : (oldOrder?.paidAmount || 0));
      const paidDiff = oldOrder ? newPaid - oldOrder.paidAmount : 0;

      const newState = {
        orders: state.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                paymentStatus: status,
                paidAmount: newPaid,
                updatedAt: new Date().toISOString()
              }
            : o
        )
      };

      if (oldOrder && oldOrder.status === 'delivered' && paidDiff !== 0 && oldOrder.clientId && !oldOrder.clientId.startsWith('temp-')) {
        newState.clients = state.clients.map((c) =>
          c.id === oldOrder.clientId
            ? { ...c, totalRevenue: Math.max(0, c.totalRevenue + paidDiff) }
            : c
        );
      }

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

  getMonthlyStats: () => computeMonthlyStats(get().orders),

  getDeliveredFiles: (filters = {}) => {
    const { orders } = get();
    const result: (DeliveryFile & {
      orderId: string;
      orderTitle: string;
      clientId: string;
      clientName: string;
      orderStatus: OrderStatus;
      paymentStatus: PaymentStatus;
      paidAmount: number;
      orderPrice: number;
    })[] = [];

    orders.forEach((o) => {
      if (filters.orderId && o.id !== filters.orderId) return;
      if (filters.clientId && o.clientId !== filters.clientId) return;

      o.deliveryFiles.forEach((f) => {
        result.push({
          ...f,
          orderId: o.id,
          orderTitle: o.title,
          clientId: o.clientId,
          clientName: o.clientName,
          orderStatus: o.status,
          paymentStatus: o.paymentStatus,
          paidAmount: o.paidAmount,
          orderPrice: o.price
        });
      });
    });

    return result.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  },

  getAvgOrderValue: () => {
    const { orders } = get();
    const delivered = orders.filter((o) => o.status === 'delivered');
    if (delivered.length === 0) return 0;
    const total = delivered.reduce((sum, o) => sum + o.paidAmount, 0);
    return Math.round(total / delivered.length);
  },

  getStatusCounts: () => {
    const { orders } = get();
    const counts: Record<OrderStatus, number> = {
      consultation: 0,
      draft: 0,
      lineart: 0,
      coloring: 0,
      revision: 0,
      delivered: 0
    };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return { ...counts, all: orders.length };
  },

  resetToMockData: () =>
    set(() => {
      const newState = {
        orders: mockOrders,
        clients: mockClients,
        quotes: mockQuotes
      };
      Taro.removeStorageSync(STORAGE_KEY);
      return newState;
    })
}));
