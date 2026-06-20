import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import {
  OrderStatus,
  ORDER_STATUS_MAP
} from '@/types';
import styles from './index.module.scss';

const STATUS_KEYS: OrderStatus[] = ['consultation', 'draft', 'lineart', 'coloring', 'revision', 'delivered'];

const ProgressAddPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;

  const { getOrderById, addProgressRecord, updateOrderStatus } = useAppStore();
  const order = useMemo(() => (orderId ? getOrderById(orderId) : undefined), [orderId, getOrderById]);

  const [status, setStatus] = useState<OrderStatus>(order?.status || 'draft');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const [revisionCount, setRevisionCount] = useState(0);

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#9ca3af', fontSize: '28rpx' }}>订单不存在</Text>
        </View>
      </View>
    );
  }

  const handleIncrease = () => {
    setRevisionCount((prev) => prev + 1);
  };

  const handleDecrease = () => {
    if (revisionCount > 0) {
      setRevisionCount((prev) => prev - 1);
    }
  };

  const validate = (): boolean => {
    if (!description.trim()) {
      Taro.showToast({ title: '请输入阶段说明', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!orderId) return;

    if (status !== order.status) {
      updateOrderStatus(orderId, status);
    }

    addProgressRecord(orderId, {
      status,
      description: description.trim(),
      feedback: feedback.trim() || undefined,
      revisionCount
    });

    Taro.showToast({ title: '已添加进度', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroBadge}>📝 新增进度记录</View>
        <Text className={styles.heroTitle}>记录当前阶段</Text>
        <Text className={styles.heroSubtitle}>保存后将自动同步到时间线与订单修改次数</Text>
        <View className={styles.heroOrder}>📦 订单：{order.title}</View>
      </View>

      <View className={styles.formContainer}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>🎯</Text>当前阶段
          </Text>
          <View className={styles.statusOptions}>
            {STATUS_KEYS.map((s) => {
              const cfg = ORDER_STATUS_MAP[s];
              const active = status === s;
              return (
                <View
                  key={s}
                  className={`${styles.statusChip} ${active ? styles.active : ''}`}
                  style={{
                    backgroundColor: active ? cfg.bgColor : '#f9fafb',
                    color: active ? cfg.color : '#6b7280',
                    borderColor: active ? cfg.color : 'transparent'
                  }}
                  onClick={() => setStatus(s)}
                >
                  {cfg.label}
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>💬</Text>阶段内容
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              阶段说明<Text className={styles.required}>*</Text>
              <Text className={styles.hint}>（如：已完成人物线稿）</Text>
            </Text>
            <Textarea
              className={styles.textarea}
              placeholder='描述本阶段完成的内容...'
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
              showConfirmBar={false}
              autoHeight
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              客户反馈<Text className={styles.hint}>（可选）</Text>
            </Text>
            <Textarea
              className={styles.textarea}
              placeholder='记录客户的修改意见或反馈内容...'
              value={feedback}
              onInput={(e) => setFeedback(e.detail.value)}
              maxlength={500}
              showConfirmBar={false}
              autoHeight
            />
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>🔄</Text>修改次数
          </Text>
          <View className={styles.revisionControl}>
            <View
              className={`${styles.controlBtn} ${revisionCount === 0 ? styles.disabled : ''}`}
              onClick={handleDecrease}
            >
              −
            </View>
            <View className={styles.revisionValue}>{revisionCount}</View>
            <View className={styles.revisionLabel}>次修改</View>
            <View
              className={styles.controlBtn}
              onClick={handleIncrease}
              style={{ marginLeft: 'auto' }}
            >
              +
            </View>
          </View>
          <View style={{ marginTop: '20rpx', fontSize: '24rpx', color: '#9ca3af' }}>
            累计修改次数：{order.revisionCount + revisionCount} 次
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>💾 保存进度</Button>
      </View>
    </View>
  );
};

export default ProgressAddPage;
