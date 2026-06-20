import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils';
import styles from './index.module.scss';

const FILE_TYPES = [
  { key: 'psd', label: 'PSD 源文件', size: '约 50MB' },
  { key: 'png', label: 'PNG 成品', size: '约 5MB' },
  { key: 'jpg', label: 'JPG 预览', size: '约 2MB' },
  { key: 'ai', label: 'AI 矢量', size: '约 3MB' },
  { key: 'pdf', label: 'PDF 文件', size: '约 8MB' },
  { key: 'other', label: '其他', size: '—' }
];

const DeliveryUploadPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;

  const { getOrderById, addDeliveryFile } = useAppStore();
  const order = useMemo(() => (orderId ? getOrderById(orderId) : undefined), [orderId, getOrderById]);

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('png');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileSize, setFileSize] = useState('约 5MB');

  const previewSeed = useMemo(() => `${orderId}-${fileName || 'delivery'}-${Date.now()}`, [orderId, fileName]);

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#9ca3af', fontSize: '28rpx' }}>订单不存在</Text>
        </View>
      </View>
    );
  }

  const handleTypeSelect = (type: string) => {
    setFileType(type);
    const typeInfo = FILE_TYPES.find((t) => t.key === type);
    if (typeInfo) {
      setFileSize(typeInfo.size);
      if (!fileName) {
        setFileName(`${order.title}_${typeInfo.label.replace(' ', '_')}`);
      }
    }
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        setPreviewUrl(tempPath);
        setFileSize('已选择 1 张图片');
      },
      fail: () => {
        const fallbackUrl = `https://picsum.photos/seed/${previewSeed}/600/800`;
        setPreviewUrl(fallbackUrl);
        setFileSize('预览图已生成');
      }
    });
  };

  const handleRemovePreview = () => {
    setPreviewUrl('');
  };

  const validate = (): boolean => {
    if (!fileName.trim()) {
      Taro.showToast({ title: '请输入文件名称', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!orderId) return;

    const finalPreview = previewUrl || `https://picsum.photos/seed/${previewSeed}/600/800`;

    addDeliveryFile(orderId, {
      name: fileName.trim(),
      type: fileType,
      size: fileSize,
      previewUrl: finalPreview
    });

    Taro.showToast({ title: '上传成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
      <View className={styles.heroBadge}>📤 上传交付物</View>
        <Text className={styles.heroTitle}>添加交付文件</Text>
        <Text className={styles.heroSubtitle}>上传完成的文件将保存在订单交付列表中</Text>
      <View className={styles.heroOrder}>📦 订单：{order.title}</View>
      </View>

      <View className={styles.formContainer}>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>📄</Text>文件信息
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>
              文件名称<Text className={styles.required}>*</Text>
            </Text>
            <Input
              className={styles.input}
              placeholder='如：角色立绘_最终版_v3.psd'
              value={fileName}
              onInput={(e) => setFileName(e.detail.value)}
              maxlength={80}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>文件类型</Text>
            <View className={styles.typeOptions}>
              {FILE_TYPES.map((t) => (
                <View
                  key={t.key}
                  className={`${styles.typeOption} ${fileType === t.key ? styles.active : ''}`}
                  onClick={() => handleTypeSelect(t.key)}
                >
                  {t.label}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>🖼️</Text>预览图
          </Text>
          <View className={styles.previewSection}>
            {previewUrl ? (
              <View className={styles.previewImage}>
                <Image
                  className={styles.image}
                  src={previewUrl}
                  mode='aspectFill'
                />
                <View className={styles.removeBtn} onClick={handleRemovePreview}>
                  ×
                </View>
              </View>
            ) : (
              <View className={styles.previewUploader} onClick={handleChooseImage}>
                <Text className={styles.uploadIcon}>📷</Text>
                <Text className={styles.uploadText}>点击选择预览图</Text>
                <Text className={styles.uploadHint}>支持相册选取或自动生成预览</Text>
              </View>
            )}
            <View className={styles.sizeRow}>
              <Text className={styles.sizeLabel}>文件大小</Text>
              <Text className={styles.sizeValue}>{fileSize}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>📤 添加到交付</Button>
      </View>
    </View>
  );
};

export default DeliveryUploadPage;
