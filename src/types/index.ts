export type OrderStatus = 'consultation' | 'draft' | 'lineart' | 'coloring' | 'revision' | 'delivered';

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export type UrgencyLevel = 'normal' | 'urgent' | 'rush';

export type LicenseScope = 'personal' | 'commercial' | 'exclusive';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Client {
  id: string;
  name: string;
  avatar?: string;
  contact: string;
  email?: string;
  note?: string;
  orderCount: number;
  totalRevenue: number;
  createdAt: string;
}

export interface ProgressRecord {
  id: string;
  status: OrderStatus;
  description: string;
  feedback?: string;
  revisionCount: number;
  createdAt: string;
}

export interface DeliveryFile {
  id: string;
  name: string;
  type: string;
  size: string;
  fileUrl?: string;
  previewUrl?: string;
  fallbackUrl?: string;
  uploadedAt: string;
}

export interface Quote {
  id: string;
  orderId?: string;
  clientId?: string;
  clientName: string;
  projectName: string;
  basePrice: number;
  complexityLevel: ComplexityLevel;
  complexityPrice: number;
  urgencyLevel: UrgencyLevel;
  urgencyPrice: number;
  licenseScope: LicenseScope;
  licensePrice: number;
  totalPrice: number;
  note?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Order {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: OrderStatus;
  size: string;
  purpose: string;
  licenseScope: LicenseScope;
  deadline: string;
  price: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  complexityLevel: ComplexityLevel;
  urgencyLevel: UrgencyLevel;
  progress: number;
  revisionCount: number;
  description?: string;
  quoteId?: string;
  progressRecords: ProgressRecord[];
  deliveryFiles: DeliveryFile[];
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  orderCount: number;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  consultation: { label: '咨询', color: '#60A5FA', bgColor: '#DBEAFE' },
  draft: { label: '草稿', color: '#A78BFA', bgColor: '#F3F0FF' },
  lineart: { label: '线稿', color: '#F59E0B', bgColor: '#FEF3C7' },
  coloring: { label: '上色', color: '#FB923C', bgColor: '#FFEDD5' },
  revision: { label: '修改', color: '#F472B6', bgColor: '#FCE7F3' },
  delivered: { label: '已交付', color: '#34D399', bgColor: '#D1FAE5' }
};

export const COMPLEXITY_MAP: Record<ComplexityLevel, { label: string; multiplier: number }> = {
  simple: { label: '简单', multiplier: 1 },
  medium: { label: '中等', multiplier: 1.5 },
  complex: { label: '复杂', multiplier: 2.2 }
};

export const URGENCY_MAP: Record<UrgencyLevel, { label: string; extraFee: number }> = {
  normal: { label: '正常', extraFee: 0 },
  urgent: { label: '加急', extraFee: 500 },
  rush: { label: '特急', extraFee: 1200 }
};

export const LICENSE_MAP: Record<LicenseScope, { label: string; multiplier: number }> = {
  personal: { label: '个人使用', multiplier: 1 },
  commercial: { label: '商用授权', multiplier: 2 },
  exclusive: { label: '独家授权', multiplier: 3.5 }
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  unpaid: { label: '未收款', color: '#F87171', bgColor: '#FEE2E2' },
  partial: { label: '部分收款', color: '#FBBF24', bgColor: '#FEF3C7' },
  paid: { label: '已收款', color: '#34D399', bgColor: '#D1FAE5' }
};
