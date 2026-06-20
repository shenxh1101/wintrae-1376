import React, { useMemo } from 'react';
import { View, Text, Button, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import {
  ORDER_STATUS_MAP,
  LICENSE_MAP,
  COMPLEXITY_MAP,
  URGENCY_MAP,
  OrderStatus,
  PAYMENT_STATUS_MAP
} from '@/types';
import { formatPrice, formatDate, formatDateTime } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  const { getOrderById, updateOrderStatus } = useAppStore();

  const order = useMemo(() => (orderId ? getOrderById(orderId) : undefined), [orderId, getOrderById]);

  useDidShow(() => {
    // 页面显示时强制刷新，确保新添加的进度/文件立即可见
    console.log('[OrderDetail] Page did show, orderId:', orderId);
  });

  if (!order) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyDetail}>
          <Text className={styles.emptyText}>订单不存在或已删除</Text>
        </View>
      </View>
    );
  }

  const sortedRecords = [...order.progressRecords].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusKeys: OrderStatus[] = ['consultation', 'draft', 'lineart', 'coloring', 'revision', 'delivered'];
  const currentIndex = statusKeys.indexOf(order.status);

  const handleUpdateStatus = () => {
    console.log('[OrderDetail] Update status for order:', order.id);
    const actions = statusKeys
      .filter((_, i) => i !== currentIndex)
      .map((s) => ({
        key: s,
        label: `移至「${ORDER_STATUS_MAP[s].label}」`
      }));

    Taro.showActionSheet({
      itemList: actions.map((a) => a.label),
      success: (res) => {
        const action = actions[res.tapIndex];
        updateOrderStatus(order.id, action.key);
        Taro.showToast({ title: '状态已更新', icon: 'success' });
        console.log('[OrderDetail] Status updated to:', action.key);
      }
    });
  };

  const handleEdit = () => {
    console.log('[OrderDetail] Navigate to edit order:', order.id);
    Taro.navigateTo({ url: `/pages/order-edit/index?id=${order.id}` });
  };

  const handleAddProgress = () => {
    console.log('[OrderDetail] Navigate to add progress:', order.id);
    Taro.navigateTo({ url: `/pages/progress-add/index?orderId=${order.id}` });
  };

  const handleUploadDelivery = () => {
    console.log('[OrderDetail] Navigate to upload delivery:', order.id);
    Taro.navigateTo({ url: `/pages/delivery-upload/index?orderId=${order.id}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroStatus}>
          <StatusBadge type='order' status={order.status} />
        </View>
        <Text className={styles.heroTitle}>{order.title}</Text>
        <View className={styles.heroClient}>
          <Text>👤 {order.clientName}</Text>
          <Text>·</Text>
          <Text>📅 截止 {formatDate(order.deadline)}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📊</Text>
            <Text>项目进度</Text>
          </View>
          <ProgressBar progress={order.progress} height={16} />
          <View style={{ display: 'flex', marginTop: '16rpx', gap: '16rpx', flexWrap: 'wrap' }}>
            <StatusBadge type='payment' status={order.paymentStatus} />
            <View style={{ fontSize: '22rpx', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4rpx' }}>
              <Text>📝</Text>
              <Text>修改 {order.revisionCount} 次</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📋</Text>
            <Text>订单信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>尺寸规格</Text>
              <Text className={styles.infoValue}>{order.size}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>用途</Text>
              <Text className={styles.infoValue}>{order.purpose}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>授权范围</Text>
              <Text className={styles.infoValue}>{LICENSE_MAP[order.licenseScope].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>复杂度</Text>
              <Text className={styles.infoValue}>{COMPLEXITY_MAP[order.complexityLevel].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>加急程度</Text>
              <Text className={styles.infoValue}>{URGENCY_MAP[order.urgencyLevel].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>
            {order.description && (
              <View className={`${styles.infoItem} ${styles.infoFull}`}>
                <Text className={styles.infoLabel}>项目描述</Text>
                <Text className={styles.infoValue} style={{ whiteSpace: 'normal', lineHeight: 1.6 }}>
                  {order.description}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>💰</Text>
            <Text>费用明细</Text>
          </View>
          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>订单总额</Text>
            <Text className={styles.priceValue}>{formatPrice(order.price)}</Text>
          </View>
          <View style={{ display: 'flex', justifyContent: 'space-between', padding: '8rpx 16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#6B7280' }}>已收款</Text>
            <Text style={{ fontSize: '24rpx', color: '#34D399', fontWeight: '500' }}>
              {formatPrice(order.paidAmount)}
            </Text>
          </View>
          {order.paidAmount < order.price && (
            <View style={{ display: 'flex', justifyContent: 'space-between', padding: '8rpx 16rpx' }}>
              <Text style={{ fontSize: '24rpx', color: '#6B7280' }}>待收款</Text>
              <Text style={{ fontSize: '24rpx', color: '#FF8A65', fontWeight: '500' }}>
                {formatPrice(order.price - order.paidAmount)}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitleRow}>
            <View className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>⏱️</Text>
              <Text>进度记录</Text>
            </View>
            <View className={styles.addBtn} onClick={handleAddProgress}>
              <Text>＋ 新增</Text>
            </View>
          </View>
          <View className={styles.timeline}>
            {sortedRecords.map((record, idx) => (
              <View key={record.id} className={styles.timelineItem}>
                <View
                  className={`${styles.timelineDot} ${idx > currentIndex ? styles.timelineDotInactive : ''}`}
                />
                <View className={styles.timelineHeader}>
                  <Text className={styles.timelineStatus}>
                    {ORDER_STATUS_MAP[record.status].label}
                  </Text>
                  <Text className={styles.timelineDate}>{formatDateTime(record.createdAt)}</Text>
                </View>
                {record.description && (
                  <Text className={styles.timelineDesc}>{record.description}</Text>
                )}
                {record.feedback && (
                  <View className={styles.timelineFeedback}>
                    <Text className={styles.timelineFeedbackLabel}>💬 客户反馈</Text>
                    <Text className={styles.timelineFeedbackText}>{record.feedback}</Text>
                  </View>
                )}
                {record.revisionCount > 0 && (
                  <View className={styles.timelineRevision}>
                    <Text>🔄</Text>
                    <Text>本轮修改 {record.revisionCount} 次</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitleRow}>
            <View className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>📁</Text>
              <Text>交付文件</Text>
            </View>
            <View className={styles.addBtn} onClick={handleUploadDelivery}>
              <Text>＋ 上传</Text>
            </View>
          </View>
          {order.deliveryFiles.length > 0 ? (
            <View className={styles.deliveryList}>
              {order.deliveryFiles.map((file) => (
                <View key={file.id} className={styles.deliveryItem}>
                  <View className={styles.deliveryThumb}>
                    {file.previewUrl ? (
                      <Image className={styles.thumbImage} src={file.previewUrl} mode='aspectFill' />
                    ) : (
                      <View style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36rpx' }}>
                        📄
                      </View>
                    )}
                  </View>
                  <View className={styles.deliveryInfo}>
                    <Text className={styles.deliveryName}>{file.name}</Text>
                    <View className={styles.deliveryMeta}>
                      <Text>{file.type?.toUpperCase()}</Text>
                      <Text>·</Text>
                      <Text>{file.size}</Text>
                    </View>
                  </View>
                  <View className={styles.downloadBtn}>下载</View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ padding: '48rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '60rpx' }}>📦</Text>
              <View style={{ fontSize: '26rpx', color: '#9ca3af', marginTop: '12rpx' }}>
                暂无交付文件，点击右上角上传
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.btnSecondary} onClick={handleEdit}>
          <Text className={styles.btnSecondaryText}>编辑订单</Text>
        </Button>
        <Button className={styles.btnPrimary} onClick={handleUpdateStatus}>
          <Text className={styles.btnPrimaryText}>更新状态</Text>
        </Button>
      </View>
    </View>
  );
};

export default OrderDetailPage;
