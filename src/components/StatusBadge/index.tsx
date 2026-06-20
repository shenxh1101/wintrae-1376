import React from 'react';
import { View, Text } from '@tarojs/components';
import { OrderStatus, ORDER_STATUS_MAP, PaymentStatus, PAYMENT_STATUS_MAP } from '@/types';
import styles from './index.module.scss';

interface StatusBadgeProps {
  type: 'order' | 'payment' | 'quote';
  status: OrderStatus | PaymentStatus | 'pending' | 'accepted' | 'rejected';
}

const quoteStatusMap = {
  pending: { label: '待确认', color: '#F59E0B', bgColor: '#FEF3C7' },
  accepted: { label: '已接受', color: '#34D399', bgColor: '#D1FAE5' },
  rejected: { label: '已拒绝', color: '#F87171', bgColor: '#FEE2E2' }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  let config;
  if (type === 'order') {
    config = ORDER_STATUS_MAP[status as OrderStatus];
  } else if (type === 'payment') {
    config = PAYMENT_STATUS_MAP[status as PaymentStatus];
  } else {
    config = quoteStatusMap[status as keyof typeof quoteStatusMap];
  }

  return (
    <View
      className={styles.badge}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <Text className={styles.text}>{config.label}</Text>
    </View>
  );
};

export default StatusBadge;
