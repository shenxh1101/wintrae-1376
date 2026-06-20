import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

const FILE_TYPES = [
  { key: 'psd', label: 'PSD', size: '约 50MB' },
  { key: 'png', label: 'PNG', size: '约 5MB' },
  { key: 'jpg', label: 'JPG', size: '约 2MB' },
  { key: 'ai', label: 'AI', size: '约 3MB' },
  { key: 'pdf', label: 'PDF', size: '约 8MB' },
  { key: 'zip', label: 'ZIP', size: '约 100MB' },
  { key: 'other', label: '其他', size: '—' }
];

const DeliveryUploadPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId;

  const { getOrderById, addDeliveryFile } = useAppStore();
  const order = useMemo(() => (orderId ? getOrderById(orderId) : undefined), [orderId, getOrderById]);

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('png');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const seed = useMemo(() => `${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, [orderId]);

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
    if (typeInfo && !fileSize) {
      setFileSize(typeInfo.size);
    }
    if (!fileName) {
      const ext = typeInfo?.label.toLowerCase() || 'file';
      setFileName(`${order.title}_最终版.${ext}`);
    }
  };

  const handleChooseFile = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFilePaths[0];
        setFileUrl(path);
        const info = res.tempFiles?.[0];
        if (info?.size) {
          const kb = info.size / 1024;
          if (kb > 1024) setFileSize(`约 ${(kb / 1024).toFixed(1)}MB`);
          else setFileSize(`约 ${Math.round(kb)}KB`);
        }
        if (!previewUrl) {
          setPreviewUrl(path);
        }
      },
      fail: () => {
        const fallback = `https://picsum.photos/seed/file-${seed}/800/1000`;
        setFileUrl(fallback);
        if (!previewUrl) setPreviewUrl(`https://picsum.photos/seed/preview-${seed}/600/800`);
        if (!fileSize) setFileSize(FILE_TYPES.find((t) => t.key === fileType)?.size || '约 5MB');
      }
    });
  };

  const handleRemoveFile = () => {
    setFileUrl('');
  };

  const handleChoosePreview = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setPreviewUrl(res.tempFilePaths[0]);
      },
      fail: () => {
        setPreviewUrl(`https://picsum.photos/seed/preview-${seed}/600/800`);
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
    if (!fileUrl) {
      Taro.showToast({ title: '请选择最终文件', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!orderId) return;

    addDeliveryFile(orderId, {
      name: fileName.trim(),
      type: fileType,
      size: fileSize,
      fileUrl,
      previewUrl: previewUrl || `https://picsum.photos/seed/${seed}/600/800`
    });

    Taro.showToast({ title: '上传成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const fileExtension = fileName.split('.').pop()?.toUpperCase() || fileType.toUpperCase();

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroBadge}>📤 上传交付物</View>
        <Text className={styles.heroTitle}>添加交付文件</Text>
        <Text className={styles.heroSubtitle}>分别上传最终文件和预览图，保存后自动关联订单</Text>
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
              maxlength={100}
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
            <Text className={styles.icon}>�</Text>文件上传
          </Text>

          <View className={styles.uploaderSection}>
            <View className={styles.sectionHeader}>
              <View className={`${styles.sectionBadge} ${styles.file}`}>📁</View>
              <Text className={styles.sectionLabel}>最终文件</Text>
              <Text className={styles.sectionHint}>必填</Text>
            </View>
            {fileUrl ? (
              <View className={styles.uploadedCard}>
                <View className={styles.fileRow}>
                  <View className={styles.fileIcon}>{fileExtension.slice(0, 3)}</View>
                  <View className={styles.fileInfo}>
                    <Text className={styles.fileName}>{fileName || '未命名文件'}</Text>
                    <Text className={styles.fileSize}>
                      {fileSize || '未知大小'} · 类型 {fileType.toUpperCase()}
                    </Text>
                  </View>
                  <View className={styles.removeBtn} onClick={handleRemoveFile}>×</View>
                </View>
              </View>
            ) : (
              <View className={styles.uploaderCard} onClick={handleChooseFile}>
                <Text className={styles.uploadIcon}>�</Text>
                <Text className={styles.uploadText}>点击选择最终文件</Text>
                <Text className={styles.uploadHint}>支持 PSD / PNG / JPG / AI / ZIP 等</Text>
              </View>
            )}
          </View>

          <View className={styles.uploaderSection}>
            <View className={styles.sectionHeader}>
              <View className={`${styles.sectionBadge} ${styles.preview}`}>🖼️</View>
              <Text className={styles.sectionLabel}>预览图</Text>
              <Text className={styles.sectionHint}>可选，未选自动生成</Text>
            </View>
            {previewUrl ? (
              <View className={styles.uploadedCard}>
                <View className={styles.previewImage}>
                  <Image className={styles.image} src={previewUrl} mode='aspectFill' />
                  <View className={styles.previewInfo}>
                    <Text className={styles.infoName}>预览图 · {fileName || '预览'}</Text>
                    <View className={styles.removeBtn} onClick={handleRemovePreview}>×</View>
                  </View>
                </View>
              </View>
            ) : (
              <View className={styles.uploaderCard} onClick={handleChoosePreview}>
                <Text className={styles.uploadIcon}>🖼️</Text>
                <Text className={styles.uploadText}>点击选择预览图</Text>
                <Text className={styles.uploadHint}>用于客户查看缩略图，留空将自动生成</Text>
              </View>
            )}
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
