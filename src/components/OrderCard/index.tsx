import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Order } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { formatPrice, getDeadlineText, formatDate } from '@/utils';
import styles from './index.module.scss';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const deadline = getDeadlineText(order.deadline, order.status);

  const handleClick = () => {
    console.log('[OrderCard] Navigate to order detail:', order.id);
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${order.id}`
    });
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <StatusBadge type='order' status={order.status} />
          <View
            className={classnames(
              styles.deadline,
              deadline.isOverdue && styles.deadlineOverdue,
              deadline.isUrgent && !deadline.isOverdue && styles.deadlineUrgent
            )}
          >
            <Text className={styles.deadlineIcon}>
              {deadline.isOverdue ? '⚠️' : '⏰'}
            </Text>
            <Text className={styles.deadlineText}>{deadline.text}</Text>
          </View>
        </View>
        <Text className={styles.price}>{formatPrice(order.price)}</Text>
      </View>

      <Text className={styles.title}>{order.title}</Text>

      <View className={styles.metaRow}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>客户</Text>
          <Text className={styles.metaValue}>{order.clientName}</Text>
        </View>
        <View className={styles.metaDivider} />
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>用途</Text>
          <Text className={styles.metaValue}>{order.purpose}</Text>
        </View>
      </View>

      <View className={styles.progressSection}>
        <ProgressBar progress={order.progress} />
      </View>

      <View className={styles.footer}>
        <View className={styles.footerItem}>
          <Text className={styles.footerIcon}>📝</Text>
          <Text className={styles.footerText}>修改 {order.revisionCount} 次</Text>
        </View>
        <View className={styles.footerItem}>
          <StatusBadge type='payment' status={order.paymentStatus} />
        </View>
        <View className={styles.footerItem}>
          <Text className={styles.footerDate}>{formatDate(order.updatedAt)}</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
