import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { Order, PaymentStatus, PAYMENT_STATUS_MAP } from '@/types';
import { formatPrice, formatDate, isOverdue } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type DeliveryFilter = 'all' | 'pending' | 'delivered';

const DeliveryPage: React.FC = () => {
  const { orders, updatePaymentStatus } = useAppStore();
  const [filter, setFilter] = useState<DeliveryFilter>('all');

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(
      (o) => o.status === 'delivered' || o.deliveryFiles.length > 0 || o.progress >= 70
    );
    if (filter === 'delivered') {
      return filtered.filter((o) => o.status === 'delivered');
    }
    if (filter === 'pending') {
      return filtered.filter((o) => o.status !== 'delivered');
    }
    return filtered;
  }, [orders, filter]);

  const deliveredPaid = useMemo(
    () => orders.filter((o) => o.status === 'delivered' && o.paymentStatus === 'paid').length,
    [orders]
  );
  const deliveredUnpaid = useMemo(
    () => orders.filter((o) => o.status === 'delivered' && o.paymentStatus !== 'paid').length,
    [orders]
  );
  const pendingRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.price - o.paidAmount), 0),
    [orders]
  );

  const handlePaymentAction = (orderId: string, currentStatus: PaymentStatus) => {
    console.log('[DeliveryPage] Payment action:', { orderId, currentStatus });
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const actions: Array<{ label: string; status?: PaymentStatus; custom?: boolean }> = [];

    if (currentStatus === 'unpaid') {
      actions.push({ label: '标记部分收款', status: 'partial' });
      actions.push({ label: '标记全部收款', status: 'paid' });
    } else if (currentStatus === 'partial') {
      actions.push({ label: '标记全部收款', status: 'paid' });
    } else {
      actions.push({ label: '撤销收款标记', status: 'unpaid' });
    }
    actions.push({ label: '查看收款详情', custom: true });

    Taro.showActionSheet({
      itemList: actions.map((a) => a.label),
      success: (res) => {
        const action = actions[res.tapIndex];
        if (action.custom) {
          Taro.showToast({ title: '详情功能开发中', icon: 'none' });
        } else if (action.status) {
          updatePaymentStatus(orderId, action.status, action.status === 'paid' ? order.price : undefined);
          Taro.showToast({ title: '状态已更新', icon: 'success' });
        }
      }
    });
  };

  const handleUploadFile = (orderId: string) => {
    console.log('[DeliveryPage] Upload file for order:', orderId);
    Taro.navigateTo({ url: `/pages/delivery-upload/index?orderId=${orderId}` });
  };

  const handleViewDetail = (orderId: string) => {
    console.log('[DeliveryPage] Navigate to order:', orderId);
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const getPaymentProgress = (order: Order): number => {
    if (order.price === 0) return 0;
    return Math.round((order.paidAmount / order.price) * 100);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>📦 文件交付</Text>
        <Text className={styles.headerSub}>管理交付物与收款进度</Text>
        <View className={styles.overviewCards}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{deliveredPaid}</Text>
            <Text className={styles.overviewLabel}>已收款交付</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{deliveredUnpaid}</Text>
            <Text className={styles.overviewLabel}>待收款</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{formatPrice(pendingRevenue)}</Text>
            <Text className={styles.overviewLabel}>待收总额</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        {[
          { key: 'all' as const, label: '全部' },
          { key: 'pending' as const, label: '待交付' },
          { key: 'delivered' as const, label: '已交付' }
        ].map((f) => (
          <Button
            key={f.key}
            className={classnames(styles.filterChip, filter === f.key && styles.filterChipActive)}
            onClick={() => setFilter(f.key)}
          >
            <Text
              className={classnames(
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive
              )}
            >
              {f.label}
            </Text>
          </Button>
        ))}
      </View>

      <View className={styles.orderSection}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>🎨</Text>
            <Text>交付订单</Text>
          </View>
          <Text className={styles.sectionCount}>{filteredOrders.length} 个</Text>
        </View>

        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <View key={order.id} className={styles.deliveryCard}>
              <View className={styles.deliveryHeader}>
                <View className={styles.deliveryInfo}>
                  <Text className={styles.deliveryTitle}>{order.title}</Text>
                  <View className={styles.deliveryMeta}>
                    <View className={styles.deliveryMetaItem}>
                      <Text className={styles.deliveryMetaIcon}>👤</Text>
                      <Text>{order.clientName}</Text>
                    </View>
                    <StatusBadge type='order' status={order.status} />
                    {isOverdue(order.deadline, order.status) && (
                      <View className={styles.deliveryMetaItem} style={{ color: '#F87171' }}>
                        <Text className={styles.deliveryMetaIcon}>⚠️</Text>
                        <Text>已逾期</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className={styles.priceTag}>{formatPrice(order.price)}</Text>
              </View>

              {order.deliveryFiles.length > 0 && (
                <>
                  <View className={styles.fileSection}>
                    <View className={styles.fileSectionTitle}>
                      <Text className={styles.fileSectionIcon}>🖼️</Text>
                      <Text>预览图</Text>
                    </View>
                    <View className={styles.previewList}>
                      {order.deliveryFiles
                        .filter((f) => f.previewUrl)
                        .slice(0, 3)
                        .map((f) => (
                          <View key={f.id} className={styles.previewItem}>
                            {f.previewUrl ? (
                              <Image
                                className={styles.previewImg}
                                src={f.previewUrl}
                                mode='aspectFill'
                                onError={(e) => console.error('[Delivery] Preview load error:', e)}
                              />
                            ) : (
                              <View className={styles.previewPlaceholder}>🖼️</View>
                            )}
                          </View>
                        ))}
                      {order.deliveryFiles.filter((f) => f.previewUrl).length === 0 &&
                        order.deliveryFiles.length > 0 && (
                          <View className={styles.previewItem}>
                            <View className={styles.previewPlaceholder}>📁</View>
                          </View>
                        )}
                    </View>

                    <View className={styles.fileList}>
                      {order.deliveryFiles.slice(0, 3).map((f) => (
                        <View key={f.id} className={styles.fileItem}>
                          <View className={styles.fileIcon}>📄</View>
                          <View className={styles.fileInfo}>
                            <Text className={styles.fileName}>{f.name}</Text>
                            <Text className={styles.fileSize}>
                              {f.type} · {f.size} · {formatDate(f.uploadedAt)}
                            </Text>
                          </View>
                          <Button className={styles.actionBtn}>
                            <Text className={styles.actionBtnText}>下载</Text>
                          </Button>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View className={styles.paymentSection}>
                <View className={styles.paymentRow}>
                  <Text className={styles.paymentLabel}>收款状态</Text>
                  <StatusBadge type='payment' status={order.paymentStatus} />
                </View>
                <View className={styles.paymentProgress}>
                  <View
                    className={styles.paymentProgressBar}
                    style={{ width: `${getPaymentProgress(order)}%` }}
                  />
                </View>
                <View className={styles.paymentRow}>
                  <Text className={styles.paymentLabel}>已收款</Text>
                  <Text className={styles.paymentValue}>{formatPrice(order.paidAmount)}</Text>
                </View>
                <View className={styles.paymentRow}>
                  <Text className={styles.paymentLabel}>订单总额</Text>
                  <Text className={classnames(styles.paymentValue, styles.paymentValueHighlight)}>
                    {formatPrice(order.price)}
                  </Text>
                </View>
                {order.paidAmount < order.price && (
                  <View className={styles.paymentRow}>
                    <Text className={styles.paymentLabel}>待收款</Text>
                    <Text
                      className={classnames(styles.paymentValue)}
                      style={{ color: '#FF8A65', fontWeight: '600' }}
                    >
                      {formatPrice(order.price - order.paidAmount)}
                    </Text>
                  </View>
                )}
              </View>

              <View className={styles.actionRow}>
                <Button
                  className={styles.actionBtnSecondary}
                  onClick={() => handleUploadFile(order.id)}
                >
                  <Text className={styles.actionBtnSecondaryText}>
                    {order.deliveryFiles.length > 0 ? '添加文件' : '上传交付物'}
                  </Text>
                </Button>
                <Button
                  className={styles.actionBtnPrimary}
                  onClick={() => handlePaymentAction(order.id, order.paymentStatus)}
                >
                  <Text className={styles.actionBtnPrimaryText}>
                    {order.paymentStatus === 'paid' ? '查看详情' : '确认收款'}
                  </Text>
                </Button>
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title='暂无交付订单'
            description='完成创作后在此处上传文件并确认收款'
          />
        )}
      </View>
    </View>
  );
};

export default DeliveryPage;
