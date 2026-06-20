import { create } from 'zustand';
import { Order, Client, Quote, OrderStatus, PaymentStatus, ProgressRecord } from '@/types';
import { mockOrders, mockClients, mockQuotes, mockMonthlyStats } from '@/data/mockData';
import { MonthlyStats } from '../types';
import { generateId } from '../utils';

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
}

export const useAppStore = create<AppState>((set, get) => ({
  orders: mockOrders,
  clients: mockClients,
  quotes: mockQuotes,
  monthlyStats: mockMonthlyStats,
  currentOrderFilter: 'all',
  searchKeyword: '',

  setOrderFilter: (filter) => set({ currentOrderFilter: filter }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addOrder: (order) =>
    set((state) => ({
      orders: [
        {
          ...order,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...state.orders
      ]
    })),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      )
    })),

  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o.id !== id) return o;
        const progressMap: Record<OrderStatus, number> = {
          consultation: 10,
          draft: 25,
          lineart: 45,
          coloring: 70,
          revision: 85,
          delivered: 100
        };
        return {
          ...o,
          status,
          progress: progressMap[status],
          updatedAt: new Date().toISOString()
        };
      })
    })),

  updatePaymentStatus: (id, status, paidAmount) =>
    set((state) => ({
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
    })),

  addProgressRecord: (orderId, record) =>
    set((state) => ({
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
    })),

  addClient: (client) =>
    set((state) => ({
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
    })),

  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c))
    })),

  addQuote: (quote) =>
    set((state) => ({
      quotes: [
        {
          ...quote,
          id: generateId(),
          createdAt: new Date().toISOString()
        },
        ...state.quotes
      ]
    })),

  updateQuoteStatus: (id, status) =>
    set((state) => ({
      quotes: state.quotes.map((q) => (q.id === id ? { ...q, status } : q))
    })),

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
    get().orders.reduce((sum, o) => sum + (o.price - o.paidAmount), 0)
}));
