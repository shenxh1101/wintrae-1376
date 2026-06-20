import React, { useMemo, useState, useEffect } from 'react';
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

const STATUS_KEYS: OrderStatus[] = ['consultation', 'draft', 'lineart', 'coloring', 'revision', 'delivered'];

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;

  const orders = useAppStore((s) => s.orders);
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus);
  const updatePaymentStatus = useAppStore((s) => s.updatePaymentStatus);

  const [refreshTick, setRefreshTick] = useState(0);

  useDidShow(() => {
    setRefreshTick((t) => t + 1);
    console.log('[OrderDetail] did show, tick:', refreshTick + 1);
  });

  const order = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshTick;
    return orders.find((o) => o.id === orderId);
  }, [orders, orderId, refreshTick]);

  const sortedRecords = useMemo(
    () => (order ? [...order.progressRecords].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : []),
    [order]
  );

  const currentIndex = useMemo(() => {
    if (!order) return -1;
    return STATUS_KEYS.indexOf(order.status);
  }, [order]);

  const handleEdit = () => {
    if (!order) return;
    console.log('[OrderDetail] Navigate to edit order:', order.id);
    Taro.navigateTo({ url: `/pages/order-edit/index?id=${order.id}` });
  };

  const handleAddProgress = () => {
    if (!order) return;
    console.log('[OrderDetail] Navigate to add progress:', order.id);
    Taro.navigateTo({ url: `/pages/progress-add/index?orderId=${order.id}` });
  };

  const handleUploadDelivery = () => {
    if (!order) return;
    console.log('[OrderDetail] Navigate to upload delivery:', order.id);
    Taro.navigateTo({ url: `/pages/delivery-upload/index?orderId=${order.id}` });
  };

  const handleImageError = (fileId: string, e: any) => {
    const img = e.currentTarget;
    const f = order?.deliveryFiles.find((x) => x.id === fileId);
    if (f?.fallbackUrl && img && img.getAttribute('data-fallback') !== '1') {
      img.setAttribute('data-fallback', '1');
      img.src = f.fallbackUrl;
    }
  };

  const getEffectivePreviewUrl = (file: any): string => {
    return file.previewUrl || file.fallbackUrl || '';
  };

  const handlePaymentChange = (status: 'unpaid' | 'partial' | 'paid') => {
    if (!order) return;
    const cfg = PAYMENT_STATUS_MAP[status];
    let paidAmount = order.paidAmount;
    if (status === 'paid') {
      paidAmount = order.price;
    } else if (status === 'unpaid') {
      paidAmount = 0;
    } else {
      Taro.showModal({
        title: '确认部分收款',
        editable: true,
        placeholderText: `输入已收款金额（0 - ${order.price}）`,
        success: (res) => {
          if (res.confirm) {
            const amount = parseFloat(res.content || '0');
            if (isNaN(amount) || amount < 0) {
              Taro.showToast({ title: '请输入有效金额', icon: 'none' });
              return;
            }
            const safeAmount = Math.min(amount, order.price);
            updatePaymentStatus(order.id, safeAmount >= order.price ? 'paid' : safeAmount <= 0 ? 'unpaid' : 'partial', safeAmount);
            Taro.showToast({ title: '已更新收款状态', icon: 'success' });
          }
        }
      });
      return;
    }
    Taro.showModal({
      title: '更新收款状态',
      content: `确定将收款状态变更为「${cfg.label}」吗？`,
      success: (res) => {
        if (res.confirm) {
          updatePaymentStatus(order.id, status, paidAmount);
          Taro.showToast({ title: `已更新为${cfg.label}`, icon: 'success' });
        }
      }
    });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#9ca3af', fontSize: '28rpx' }}>订单不存在</Text>
        </View>
      </View>
    );
  }

  const statusCfg = ORDER_STATUS_MAP[order.status];

  return (
    <View className={styles.page}>
      <View className={styles.hero} style={{ background: `linear-gradient(135deg, ${statusCfg.bgColor} 0%, #7B5CFF 60%, #EC4899 100%)` }}>
        <StatusBadge status={order.status} size='large' />
        <Text className={styles.heroTitle}>{order.title}</Text>
        <View className={styles.heroMeta}>
          <Text className={styles.heroMetaItem}>👤 {order.clientName}</Text>
          <Text className={styles.heroMetaItem}>📅 截止 {formatDate(order.deadline)}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📊</Text>
            <Text>进度概览</Text>
          </View>
          <View className={styles.progressSection}>
            <View className={styles.progressHeader}>
              <Text className={styles.progressLabel}>完成进度</Text>
              <Text className={styles.progressValue}>{order.progress}%</Text>
            </View>
            <ProgressBar progress={order.progress} />
            <View className={styles.progressFooter}>
              <Text className={styles.revisionCount}>🔄 修改 {order.revisionCount} 次</Text>
              <View
                className={styles.addProgressBtn}
                onClick={handleAddProgress}
              >
                ＋ 新增进度
              </View>
            </View>
          </View>

          <View className={styles.quickActions}>
            {STATUS_KEYS.filter((_, i) => Math.abs(i - currentIndex) <= 1 && i !== currentIndex).map((s) => (
              <View key={s} className={styles.actionBtn} onClick={() => handleStatusChange(s)}>
                <Text className={styles.actionBtnText}>→ {ORDER_STATUS_MAP[s].label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📋</Text>
            <Text>订单信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>尺寸</Text>
              <Text className={styles.infoValue}>{order.size}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>用途</Text>
              <Text className={styles.infoValue}>{order.purpose}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>授权</Text>
              <Text className={styles.infoValue}>{LICENSE_MAP[order.licenseScope].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>复杂度</Text>
              <Text className={styles.infoValue}>{COMPLEXITY_MAP[order.complexityLevel].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>加急</Text>
              <Text className={styles.infoValue}>{URGENCY_MAP[order.urgencyLevel].label}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>创建时间</Text>
              <Text className={styles.infoValue}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
          {order.description && (
            <View className={styles.infoDescription}>
              <Text className={styles.infoLabel}>详细说明</Text>
              <Text className={styles.infoDescriptionText}>{order.description}</Text>
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <View className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>💰</Text>
            <Text>费用与收款</Text>
          </View>
          <View className={styles.priceSection}>
            <View className={styles.priceTotal}>
              <Text className={styles.priceTotalLabel}>订单金额</Text>
              <Text className={styles.priceTotalValue}>{formatPrice(order.price)}</Text>
            </View>
            <View className={styles.paymentStatusBar}>
              <View
                className={styles.paymentProgressFill}
                style={{ width: `${order.price > 0 ? Math.min(100, (order.paidAmount / order.price) * 100) : 0}%` }}
              />
            </View>
            <View className={styles.paymentInfo}>
              <View className={styles.paidInfo}>
                <Text className={styles.paidLabel}>已收款</Text>
                <Text className={styles.paidValue}>{formatPrice(order.paidAmount)}</Text>
              </View>
              <View className={styles.pendingInfo}>
                <Text className={styles.pendingLabel}>待收款</Text>
                <Text className={styles.pendingValue}>{formatPrice(order.price - order.paidAmount)}</Text>
              </View>
            </View>
          </View>

          <View className={styles.paymentActions}>
            <View
              className={`${styles.paymentBtn} ${order.paymentStatus === 'unpaid' ? styles.paymentBtnActive : ''}`}
              onClick={() => handlePaymentChange('unpaid')}
            >
              未收款
            </View>
            <View
              className={`${styles.paymentBtn} ${order.paymentStatus === 'partial' ? styles.paymentBtnActive : ''}`}
              onClick={() => handlePaymentChange('partial')}
            >
              部分收款
            </View>
            <View
              className={`${styles.paymentBtn} ${order.paymentStatus === 'paid' ? styles.paymentBtnActive : ''}`}
              onClick={() => handlePaymentChange('paid')}
            >
              已收款
            </View>
          </View>
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
            {sortedRecords.length > 0 ? (
              sortedRecords.map((record, idx) => (
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
              ))
            ) : (
              <View style={{ padding: '48rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: '60rpx' }}>📝</Text>
                <View style={{ fontSize: '26rpx', color: '#9ca3af', marginTop: '12rpx' }}>
                  暂无进度记录，点击右上角新增
                </View>
              </View>
            )}
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
                    {getEffectivePreviewUrl(file) ? (
                      <Image
                        className={styles.thumbImage}
                        src={getEffectivePreviewUrl(file)}
                        mode='aspectFill'
                        onError={(e) => handleImageError(file.id, e)}
                      />
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
                      <Text>·</Text>
                      <Text>{formatDate(file.uploadedAt)}</Text>
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
        <Button className={styles.editBtn} onClick={handleEdit}>✏️ 编辑订单</Button>
        <View className={styles.statusQuickBtns}>
          {STATUS_KEYS.slice(currentIndex + 1, currentIndex + 2).map((s) => (
            <Button
              key={s}
              className={styles.statusBtn}
              style={{ background: `linear-gradient(135deg, ${statusCfg.bgColor} 0%, ${ORDER_STATUS_MAP[s].bgColor} 100%)` }}
              onClick={() => handleStatusChange(s)}
            >
              推进至 {ORDER_STATUS_MAP[s].label}
            </Button>
          ))}
          {currentIndex >= STATUS_KEYS.length - 1 && (
            <Button className={styles.statusBtn} onClick={() => Taro.showToast({ title: '已到最终状态', icon: 'none' })}>
              ✅ 已完成
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderDetailPage;
