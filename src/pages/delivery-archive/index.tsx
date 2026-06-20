import React, { useMemo, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { Client, PAYMENT_STATUS_MAP } from '@/types';
import { formatPrice, formatDateTime } from '@/utils';
import styles from './index.module.scss';

type SortMode = 'time' | 'client';

const DeliveryArchivePage: React.FC = () => {
  const orders = useAppStore((s) => s.orders);
  const clients = useAppStore((s) => s.clients);
  const getDeliveredFiles = useAppStore((s) => s.getDeliveredFiles);

  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('time');
  const [refreshTick, setRefreshTick] = useState(0);

  useDidShow(() => {
    setRefreshTick((t) => t + 1);
  });

  const clientOptions: { label: string; value: string }[] = useMemo(
    () => [
      { label: '全部客户', value: 'all' },
      ...clients.map((c: Client) => ({ label: c.name, value: c.id }))
    ],
    [clients, refreshTick]
  );

  const allFiles = useMemo(() => {
    const filters: any = {};
    if (clientFilter !== 'all') filters.clientId = clientFilter;
    const files = getDeliveredFiles(filters);
    if (sortMode === 'client') {
      return files.sort((a, b) => a.clientName.localeCompare(b.clientName));
    }
    return files;
  }, [orders, clients, clientFilter, sortMode, getDeliveredFiles, refreshTick]);

  const stats = useMemo(() => {
    const total = allFiles.length;
    const paidFiles = allFiles.filter((f) => f.paymentStatus === 'paid');
    const paidValue = paidFiles.reduce((sum, f) => sum + f.orderPrice, 0);
    return { total, paidCount: paidFiles.length, paidValue };
  }, [allFiles]);

  const handleViewOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleViewClient = (clientId: string) => {
    if (clientId && !clientId.startsWith('temp-')) {
      Taro.navigateTo({ url: `/pages/client-edit/index?id=${clientId}` });
    } else {
      Taro.showToast({ title: '该客户为临时客户', icon: 'none' });
    }
  };

  const handleDownload = (file: any) => {
    Taro.showActionSheet({
      itemList: [`打开预览图`, `复制文件名：${file.name}`, '查看订单详情'],
      success: (res) => {
        if (res.tapIndex === 0 && file.previewUrl) {
          Taro.previewImage({ urls: [file.previewUrl] });
        } else if (res.tapIndex === 1) {
          Taro.setClipboardData({ data: file.name });
        } else if (res.tapIndex === 2) {
          handleViewOrder(findOrderId(file));
        }
      }
    });
  };

  const findOrderId = (f: any) => {
    const o = orders.find((ord) => ord.deliveryFiles.some((df) => df.id === f.id));
    return o?.id || '';
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroBadge}>📦 交付归档</View>
        <Text className={styles.heroTitle}>历史交付文件</Text>
        <View className={styles.heroStats}>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总交付文件</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{stats.paidCount}</Text>
            <Text className={styles.statLabel}>已收款交付</Text>
          </View>
          <View className={styles.statBox}>
            <Text className={styles.statValue}>{formatPrice(stats.paidValue).replace('¥', '¥')}</Text>
            <Text className={styles.statLabel}>已收款金额</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterCard}>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>客户筛选</Text>
            <View className={styles.filterChips}>
              {clientOptions.map((opt) => (
                <View
                  key={opt.value}
                  className={`${styles.chip} ${clientFilter === opt.value ? styles.active : ''}`}
                  onClick={() => setClientFilter(opt.value)}
                >
                  {opt.label}
                </View>
              ))}
            </View>
          </View>
          <View className={styles.filterRow}>
            <Text className={styles.filterLabel}>排序方式</Text>
            <View className={styles.filterChips}>
              <View
                className={`${styles.chip} ${sortMode === 'time' ? styles.active : ''}`}
                onClick={() => setSortMode('time')}
              >
                按时间倒序
              </View>
              <View
                className={`${styles.chip} ${sortMode === 'client' ? styles.active : ''}`}
                onClick={() => setSortMode('client')}
              >
                按客户排序
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.fileList}>
        {allFiles.length > 0 ? (
          allFiles.map((file) => (
            <View key={file.id} className={styles.fileCard}>
              <View className={styles.fileCardHeader}>
                <View className={styles.fileThumb}>
                  {file.previewUrl ? (
                    <Image className={styles.thumbImage} src={file.previewUrl} mode='aspectFill' />
                  ) : (
                    <View style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48rpx' }}>
                      📄
                    </View>
                  )}
                  {file.type && (
                    <View className={styles.typeBadge}>{file.type.toUpperCase().slice(0, 4)}</View>
                  )}
                </View>
                <View className={styles.fileInfo}>
                  <Text className={styles.fileName}>{file.name}</Text>
                  <Text className={styles.orderInfo}>📦 {file.orderTitle}</Text>
                  <View className={styles.fileMeta}>
                    <Text>👤 {file.clientName}</Text>
                    <Text className={styles.dot}>·</Text>
                    <Text>{formatDateTime(file.uploadedAt)}</Text>
                  </View>
                </View>
              </View>
              <View className={styles.fileCardBody}>
                <View className={`${styles.infoTag} payment-${file.paymentStatus}`}>
                  <Text>{PAYMENT_STATUS_MAP[file.paymentStatus].label}</Text>
                  <Text>·</Text>
                  <Text>
                    {formatPrice(file.paidAmount)} / {formatPrice(file.orderPrice)}
                  </Text>
                </View>
                {file.size && <View className={styles.infoTag}>💾 {file.size}</View>}
              </View>
              <View className={styles.fileCardFooter}>
                <View className={styles.footerBtn} onClick={() => handleDownload(file)}>
                  📥 查看
                </View>
                <View className={styles.footerBtn} onClick={() => handleViewClient(file.clientId)}>
                  👤 客户
                </View>
                <View
                  className={`${styles.footerBtn} ${styles.primary}`}
                  onClick={() => handleViewOrder(findOrderId(file))}
                >
                  📦 订单
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <View className={styles.emptyIcon}>📦</View>
            <Text className={styles.emptyText}>暂无交付文件</Text>
            <Text className={styles.emptySub}>
              上传文件后会自动同步到这里，方便后续查找与归档
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default DeliveryArchivePage;
