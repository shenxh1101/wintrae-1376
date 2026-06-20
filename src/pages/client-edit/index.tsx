import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/utils';
import styles from './index.module.scss';

const ClientEditPage: React.FC = () => {
  const router = useRouter();
  const clientId = router.params.id;
  const isEdit = !!clientId;
  const fromPicker = router.params.from === 'picker';

  const { getClientById, addClient, updateClient } = useAppStore();
  const existingClient = useMemo(
    () => (clientId ? getClientById(clientId) : undefined),
    [clientId, getClientById]
  );

  const [name, setName] = useState(existingClient?.name || '');
  const [contact, setContact] = useState(existingClient?.contact || '');
  const [email, setEmail] = useState(existingClient?.email || '');
  const [note, setNote] = useState(existingClient?.note || '');

  const avatarText = useMemo(() => {
    if (name) return name.charAt(0).toUpperCase();
    return '?';
  }, [name]);

  const validate = (): boolean => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入客户姓名', icon: 'none' });
      return false;
    }
    if (!contact.trim()) {
      Taro.showToast({ title: '请输入联系方式', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isEdit && clientId) {
      updateClient(clientId, {
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim() || undefined,
        note: note.trim() || undefined
      });
      Taro.showToast({ title: '修改成功', icon: 'success' });
    } else {
      addClient({
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim() || undefined,
        note: note.trim() || undefined
      });
      Taro.showToast({ title: '创建成功', icon: 'success' });
    }

    setTimeout(() => {
      if (fromPicker) {
        Taro.navigateBack();
      } else {
        Taro.navigateBack();
      }
    }, 600);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <View className={styles.heroBadge}>{isEdit ? '✏️ 编辑客户' : '➕ 新建客户'}</View>
        <Text className={styles.heroTitle}>{isEdit ? '修改客户信息' : '添加新客户'}</Text>
        <Text className={styles.heroSubtitle}>
          {isEdit ? '更新客户的联系方式与备注信息' : '录入客户资料，方便后续管理委托订单'}
        </Text>
      </View>

      <View className={styles.formContainer}>
        <View className={styles.card}>
          <View className={styles.avatarSection}>
            <View className={styles.avatarCircle}>{avatarText}</View>
            <Text className={styles.avatarHint}>客户头像（自动生成）</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>👤</Text>基本信息
          </Text>

          <View className={styles.formGroup}>
            <Text className={styles.label}>客户姓名<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              placeholder='如：张小明 / 星辰工作室'
              value={name}
              onInput={(e) => setName(e.detail.value)}
              maxlength={30}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>联系方式<Text className={styles.required}>*</Text></Text>
            <Input
              className={styles.input}
              placeholder='手机号 / 微信号 / QQ号'
              value={contact}
              onInput={(e) => setContact(e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.label}>邮箱（可选）</Text>
            <Input
              className={styles.input}
              placeholder='example@email.com'
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
              maxlength={100}
            />
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.icon}>📝</Text>备注信息
          </Text>
          <View className={styles.formGroup}>
            <Textarea
              className={styles.textarea}
              placeholder='记录客户偏好、风格要求、沟通注意事项等...'
              value={note}
              onInput={(e) => setNote(e.detail.value)}
              maxlength={500}
              showConfirmBar={false}
              autoHeight
            />
          </View>
        </View>

        {isEdit && existingClient && (
          <View className={styles.card}>
            <Text className={styles.cardTitle}>
              <Text className={styles.icon}>📊</Text>合作数据
            </Text>
            <View className={styles.statsRow}>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{existingClient.orderCount}</Text>
                <Text className={styles.statLabel}>合作订单</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{formatPrice(existingClient.totalRevenue)}</Text>
                <Text className={styles.statLabel}>累计收入</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          {isEdit ? '💾 保存修改' : '✨ 创建客户'}
        </Button>
      </View>
    </View>
  );
};

export default ClientEditPage;
