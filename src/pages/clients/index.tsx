import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { Client } from '@/types';
import { formatPrice } from '@/utils';
import ClientCard from '@/components/ClientCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const ClientsPage: React.FC = () => {
  const { clients } = useAppStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchKeyword.trim()) return clients;
    const kw = searchKeyword.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.contact.includes(kw) ||
        (c.email && c.email.toLowerCase().includes(kw)) ||
        (c.note && c.note.toLowerCase().includes(kw))
    );
  }, [clients, searchKeyword]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredClients]);

  const totalRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + c.totalRevenue, 0),
    [clients]
  );

  const totalOrders = useMemo(
    () => clients.reduce((sum, c) => sum + c.orderCount, 0),
    [clients]
  );

  const handleAddClient = () => {
    console.log('[ClientsPage] Add new client');
    Taro.navigateTo({ url: '/pages/client-edit/index' });
  };

  const handleClientClick = (clientId: string) => {
    console.log('[ClientsPage] Click client:', clientId);
    Taro.navigateTo({ url: `/pages/client-edit/index?id=${clientId}` });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>👥 客户管理</Text>
        <Text className={styles.headerSub}>维护你的客户关系网络</Text>
        <View className={styles.summaryCards}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{clients.length}</Text>
            <Text className={styles.summaryLabel}>位客户</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{totalOrders}</Text>
            <Text className={styles.summaryLabel}>笔合作</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{formatPrice(totalRevenue)}</Text>
            <Text className={styles.summaryLabel}>累计收入</Text>
          </View>
        </View>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder='搜索客户姓名、电话...'
          value={searchKeyword}
          onInput={(e) => setSearchKeyword(e.detail.value)}
        />
      </View>

      <View className={styles.clientList}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📊</Text>
          <Text>按收入排序</Text>
          <Text style={{ fontSize: '22rpx', color: '#9CA3AF', marginLeft: 'auto' }}>
            共 {sortedClients.length} 位
          </Text>
        </View>

        {sortedClients.length > 0 ? (
          sortedClients.map((client) => (
            <View key={client.id} onClick={() => handleClientClick(client.id)}>
              <ClientCard client={client} />
            </View>
          ))
        ) : (
          <EmptyState
            title={searchKeyword ? '没有匹配的客户' : '暂无客户'}
            description={searchKeyword ? '换个关键词试试' : '点击右下角 + 号添加新客户'}
          />
        )}
      </View>

      <Button className={styles.addFab} onClick={handleAddClient}>
        <Text className={styles.addFabIcon}>+</Text>
      </Button>
    </View>
  );
};

export default ClientsPage;
