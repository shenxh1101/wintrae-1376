import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import {
  OrderStatus,
  ComplexityLevel,
  UrgencyLevel,
  LicenseScope,
  ORDER_STATUS_MAP,
  COMPLEXITY_MAP,
  URGENCY_MAP,
  LICENSE_MAP
} from '@/types';
import { calculateQuote, formatDate } from '@/utils';
import styles from './index.module.scss';

const STATUS_KEYS: OrderStatus[] = ['consultation', 'draft', 'lineart', 'coloring', 'revision', 'delivered'];
const COMPLEXITY_KEYS: ComplexityLevel[] = ['simple', 'medium', 'complex'];
const URGENCY_KEYS: UrgencyLevel[] = ['normal', 'urgent', 'rush'];
const LICENSE_KEYS: LicenseScope[] = ['personal', 'commercial', 'exclusive'];

const OrderEditPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  const isEdit = !!orderId;

  const { getOrderById, clients, addOrder, updateOrder, getClientById } = useAppStore();
  const existingOrder = useMemo(() => (orderId ? getOrderById(orderId) : undefined), [orderId, getOrderById]);
  const existingClient = useMemo(
    () => (existingOrder?.clientId ? getClientById(existingOrder.clientId) : undefined),
    [existingOrder, getClientById]
  );

  const [title, setTitle] = useState(existingOrder?.title || '');
  const [clientId, setClientId] = useState(existingOrder?.clientId || '');
  const [customClientName, setCustomClientName] = useState('');
  const [status, setStatus] = useState<OrderStatus>(existingOrder?.status || 'consultation');
  const [size, setSize] = useState(existingOrder?.size || '');
  const [purpose, setPurpose] = useState(existingOrder?.purpose || '');
  const [licenseScope, setLicenseScope] = useState<LicenseScope>(existingOrder?.licenseScope || 'personal');
  const [deadline, setDeadline] = useState(existingOrder?.deadline?.split('T')[0] || '');
  const [basePrice, setBasePrice] = useState<string>(existingOrder ? String(existingOrder.price) : '');
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>(existingOrder?.complexityLevel || 'medium');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(existingOrder?.urgencyLevel || 'normal');
  const [description, setDescription] = useState(existingOrder?.description || '');

  const clientName = useMemo(() => {
    if (clientId) {
      const c = clients.find((cl) => cl.id === clientId);
      return c?.name || '';
    }
    return customClientName;
  }, [clientId, clients, customClientName]);

  const clientOptions = useMemo(() => {
    return clients.map((c) => c.name);
  }, [clients]);

  const quoteBreakdown = useMemo(() => {
    const price = parseFloat(basePrice) || 0;
    if (price <= 0) return null;
    return calculateQuote(price, complexityLevel, urgencyLevel, licenseScope);
  }, [basePrice, complexityLevel, urgencyLevel, licenseScope]);

  const [clientPickerIndex, setClientPickerIndex] = useState(0);

  useEffect(() => {
    if (isEdit && existingClient) {
      const idx = clients.findIndex((c) => c.id === existingClient.id);
      if (idx >= 0) setClientPickerIndex(idx);
    }
  }, [isEdit, existingClient, clients]);

  useDidShow(() => {
    if (customClientName) return;
    if (clientId) {
      const idx = clients.findIndex((c) => c.id === clientId);
      if (idx >= 0) setClientPickerIndex(idx);
    }
  });

  const handleClientChange = (e) => {
    const idx = parseInt(e.detail.value);
    setClientPickerIndex(idx);
    if (idx < clients.length) {
      setClientId(clients[idx].id);
      setCustomClientName('');
    }
  };

  const handleAddClient = () => {
    console.log('[OrderEdit] Navigate to add client');
    Taro.navigateTo({ url: '/pages/client-edit/index?from=picker' });
  };

  const handleDateChange = (e) => {
    setDeadline(e.detail.value);
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入订单标题', icon: 'none' });
      return false;
    }
    if (!clientName.trim()) {
      Taro.showToast({ title: '请选择客户', icon: 'none' });
      return false;
    }
    if (!size.trim()) {
      Taro.showToast({ title: '请输入尺寸', icon: 'none' });
      return false;
    }
    if (!purpose.trim()) {
      Taro.showToast({ title: '请输入用途', icon: 'none' });
      return false;
    }
    if (!deadline) {
      Taro.showToast({ title: '请选择截止日期', icon: 'none' });
      return false;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      Taro.showToast({ title: '请输入有效基础价格', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const price = quoteBreakdown?.totalPrice || parseFloat(basePrice);

    if (isEdit && orderId) {
      updateOrder(orderId, {
        title: title.trim(),
        clientId: clientId || `temp-${Date.now()}`,
        clientName: clientName.trim(),
        status,
        size: size.trim(),
        purpose: purpose.trim(),
        licenseScope,
        deadline: new Date(deadline).toISOString(),
        price,
        complexityLevel,
        urgencyLevel,
        description: description.trim() || undefined
      });
      Taro.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 600);
    } else {
      const progressMap: Record<OrderStatus, number> = {
        consultation: 10,
        draft: 25,
        lineart: 45,
        coloring: 70,
        revision: 85,
        delivered: 100
      };
      addOrder({
        title: title.trim(),
        clientId: clientId || `temp-${Date.now()}`,
        clientName: clientName.trim(),
        status,
        size: size.trim(),
        purpose: purpose.trim(),
        licenseScope,
        deadline: new Date(deadline).toISOString(),
        price,
        paymentStatus: 'unpaid',
        paidAmount: 0,
        complexityLevel,
        urgencyLevel,
        progress: progressMap[status],
        revisionCount: 0,
        description: description.trim() || undefined,
        progressRecords: [
          {
            status,
            description: '订单创建',
            revisionCount: 0
          }
        ],
        deliveryFiles: []
      });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 600);
    }
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroBadge}>{isEdit ? '✏️ 编辑模式' : '✨ 新建订单'}</View>
        <Text className={styles.heroTitle}>{isEdit ? '修改订单信息' : '创建新委托'}</Text>
        <Text className={styles.heroSubtitle}>
          {isEdit ? '修改并保存以下订单信息，所有变更将实时同步' : '填写委托信息并生成报价，开始新的创作'}
        </Text>
      </View>

      <View className={styles.formContainer}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>📋</Text>基本信息
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>订单标题<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              placeholder='如：游戏角色立绘 / 品牌插画设计'
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={60}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>客户<Text className={styles.required}>*</Text></Text>
            <Picker mode='selector' range={clientOptions} value={clientPickerIndex} onChange={handleClientChange}>
              <View className={styles.picker}>
                <Text className={clientName ? styles.pickerValue : styles.pickerPlaceholder}>
                  {clientName || '请选择客户'}
                </Text>
                <Text className={styles.pickerArrow}>▼</Text>
              </View>
            </Picker>
            <View className={styles.addClientBtn} onClick={handleAddClient}>
              ＋ 新建客户
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>订单状态<Text className={styles.required}>*</Text></Text>
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
                      border: `2rpx solid ${active ? cfg.color : '#e5e7eb'}`
                    }}
                    onClick={() => setStatus(s)}
                  >
                    {cfg.label}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>🎨</Text>规格与授权
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>尺寸<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              placeholder='如：1080×1920px / A4 300dpi'
              value={size}
              onInput={(e) => setSize(e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>用途<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              placeholder='如：社交媒体配图 / 游戏立绘 / 书籍封面'
              value={purpose}
              onInput={(e) => setPurpose(e.detail.value)}
            />
          </View>

          <View className={styles.segmentGroup}>
            <Text className={styles.label}>授权范围<Text className={styles.required}>*</Text></Text>
            <View className={styles.segmentOptions}>
              {LICENSE_KEYS.map((k) => {
                const cfg = LICENSE_MAP[k];
                const active = licenseScope === k;
                return (
                  <View
                    key={k}
                    className={`${styles.segmentOption} ${active ? styles.active : ''}`}
                    onClick={() => setLicenseScope(k)}
                  >
                    <Text className={styles.optionLabel}>{cfg.label}</Text>
                    <Text className={styles.optionMeta}>×{cfg.multiplier}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.formGroup} style={{ marginTop: '28rpx' }}>
            <Text className={styles.label}>截止日期<Text className={styles.required}>*</Text></Text>
            <Picker mode='date' value={deadline} start={formatDate(new Date().toISOString())} onChange={handleDateChange}>
              <View className={styles.picker}>
                <Text className={deadline ? styles.pickerValue : styles.pickerPlaceholder}>
                  {deadline || '请选择截止日期'}
                </Text>
                <Text className={styles.pickerArrow}>📅</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>💰</Text>报价配置
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>基础价格（元）<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              type='digit'
              placeholder='如：1000'
              value={basePrice}
              onInput={(e) => setBasePrice(e.detail.value)}
            />
          </View>

          <View className={styles.segmentGroup}>
            <Text className={styles.label}>复杂程度</Text>
            <View className={styles.segmentOptions}>
              {COMPLEXITY_KEYS.map((k) => {
                const cfg = COMPLEXITY_MAP[k];
                const active = complexityLevel === k;
                return (
                  <View
                    key={k}
                    className={`${styles.segmentOption} ${active ? styles.active : ''}`}
                    onClick={() => setComplexityLevel(k)}
                  >
                    <Text className={styles.optionLabel}>{cfg.label}</Text>
                    <Text className={styles.optionMeta}>×{cfg.multiplier}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={styles.segmentGroup} style={{ marginTop: '28rpx' }}>
            <Text className={styles.label}>加急程度</Text>
            <View className={styles.segmentOptions}>
              {URGENCY_KEYS.map((k) => {
                const cfg = URGENCY_MAP[k];
                const active = urgencyLevel === k;
                return (
                  <View
                    key={k}
                    className={`${styles.segmentOption} ${active ? styles.active : ''}`}
                    onClick={() => setUrgencyLevel(k)}
                  >
                    <Text className={styles.optionLabel}>{cfg.label}</Text>
                    <Text className={styles.optionMeta}>+¥{cfg.extraFee}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {quoteBreakdown && (
            <View className={styles.pricePreview}>
              <Text className={styles.previewTitle}>📊 报价预览</Text>
              <View className={styles.previewTotal}>
                <Text className={styles.currency}>¥</Text>
                {quoteBreakdown.totalPrice.toLocaleString('zh-CN')}
              </View>
              <View className={styles.previewBreakdown}>
                <View className={styles.breakdownRow}>
                  <Text className={styles.breakdownLabel}>基础价格</Text>
                  <Text className={styles.breakdownValue}>¥{parseFloat(basePrice).toLocaleString('zh-CN')}</Text>
                </View>
                <View className={styles.breakdownRow}>
                  <Text className={styles.breakdownLabel}>复杂度加价</Text>
                  <Text className={styles.breakdownValue}>+¥{quoteBreakdown.complexityPrice.toLocaleString('zh-CN')}</Text>
                </View>
                <View className={styles.breakdownRow}>
                  <Text className={styles.breakdownLabel}>加急附加费</Text>
                  <Text className={styles.breakdownValue}>+¥{quoteBreakdown.urgencyPrice.toLocaleString('zh-CN')}</Text>
                </View>
                <View className={styles.breakdownRow}>
                  <Text className={styles.breakdownLabel}>授权加价</Text>
                  <Text className={styles.breakdownValue}>+¥{quoteBreakdown.licensePrice.toLocaleString('zh-CN')}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>📝</Text>补充说明
          </Text>
          <View className={styles.formGroup}>
            <Textarea
              className={styles.textarea}
              placeholder='记录特殊要求、参考风格、客户偏好等备注信息...'
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={500}
              showConfirmBar={false}
              autoHeight
            />
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {isEdit ? '💾 保存修改' : '🚀 创建订单'}
        </Button>
      </View>
    </View>
  );
};

export default OrderEditPage;
