import dayjs from 'dayjs';
import {
  ComplexityLevel,
  UrgencyLevel,
  LicenseScope,
  COMPLEXITY_MAP,
  URGENCY_MAP,
  LICENSE_MAP
} from '@/types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const calculateQuote = (
  basePrice: number,
  complexity: ComplexityLevel,
  urgency: UrgencyLevel,
  license: LicenseScope
): {
  complexityPrice: number;
  urgencyPrice: number;
  licensePrice: number;
  totalPrice: number;
} => {
  const complexityPrice = Math.round(basePrice * (COMPLEXITY_MAP[complexity].multiplier - 1));
  const urgencyPrice = URGENCY_MAP[urgency].extraFee;
  const licenseBase = basePrice + complexityPrice;
  const licensePrice = Math.round(licenseBase * (LICENSE_MAP[license].multiplier - 1));
  const totalPrice = basePrice + complexityPrice + urgencyPrice + licensePrice;

  return { complexityPrice, urgencyPrice, licensePrice, totalPrice };
};

export const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString('zh-CN')}`;
};

export const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateTime = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const isOverdue = (deadline: string, status: string): boolean => {
  if (status === 'delivered') return false;
  return dayjs().isAfter(dayjs(deadline), 'day');
};

export const daysUntilDeadline = (deadline: string): number => {
  return dayjs(deadline).diff(dayjs(), 'day');
};

export const getDeadlineText = (deadline: string, status: string): { text: string; isOverdue: boolean; isUrgent: boolean } => {
  if (status === 'delivered') {
    return { text: '已完成', isOverdue: false, isUrgent: false };
  }
  const days = daysUntilDeadline(deadline);
  const overdue = isOverdue(deadline, status);

  if (overdue) {
    return { text: `逾期 ${Math.abs(days)} 天`, isOverdue: true, isUrgent: false };
  }
  if (days === 0) {
    return { text: '今天截止', isOverdue: false, isUrgent: true };
  }
  if (days <= 3) {
    return { text: `还剩 ${days} 天`, isOverdue: false, isUrgent: true };
  }
  return { text: `还剩 ${days} 天`, isOverdue: false, isUrgent: false };
};
