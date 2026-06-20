import React, { useMemo } from 'react';
import { View, Text, Input, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { OrderStatus, ORDER_STATUS_MAP } from '@/types';
import { formatPrice } from '@/utils';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const BoardPage: React.FC = () => {
  const {
    orders,
    currentOrderFilter,
    searchKeyword,
    setOrderFilter,
    setSearchKeyword,
    getFilteredOrders,
    getTotalRevenue,
    getPendingRevenue,
    getOverdueOrders
  } = useAppStore();

  useDidShow(() => {
    console.log('[BoardPage] Page showed');
  });

  const filteredOrders = useMemo(() => getFilteredOrders(), [orders, currentOrderFilter, searchKeyword, getFilteredOrders]);

  const statusFilters: Array<{ key: OrderStatus | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'consultation', label: '咨询' },
    { key: 'draft', label: '草稿' },
    { key: 'lineart', label: '线稿' },
    { key: 'coloring', label: '上色' },
    { key: 'revision', label: '修改' },
    { key: 'delivered', label: '已交付' }
  ];

  const getFilterCount = (key: OrderStatus | 'all'): number => {
    if (key === 'all') return orders.length;
    return orders.filter((o) => o.status === key).length;
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const overdueCount = getOverdueOrders().length;
  const thisMonthRevenue = orders
    .filter((o) => dayjs(o.updatedAt).isSame(dayjs(), 'month') && o.status === 'delivered')
    .reduce((sum, o) => sum + o.paidAmount, 0);

  const handleAddOrder = () => {
    console.log('[BoardPage] Navigate to create order');
    Taro.navigateTo({ url: '/pages/order-edit/index' });
  };

  const handlePullDownRefresh = () => {
    console.log('[BoardPage] Pull to refresh');
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 800);
  };

  return (
    <View className={styles.page} onPullDownRefresh={handlePullDownRefresh}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.greeting}>
            <Text className={styles.greetingTitle}>👋 欢迎回来</Text>
            <Text className={styles.greetingSub}>今天有 {activeOrders.length} 个订单在进行中</Text>
          </View>
          <Button className={styles.addBtn} onClick={handleAddOrder}>
            <Text className={styles.addBtnIcon}>+</Text>
          </Button>
        </View>

        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索订单、客户、用途...'
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.statsRow}>
        <StatCard
          label='本月收入'
          value={formatPrice(thisMonthRevenue)}
          subLabel={`${dayjs().format('M月')}累计`}
          color='#7B5CFF'
        />
        <StatCard
          label='待收款项'
          value={formatPrice(getPendingRevenue())}
          subLabel='待确认收款'
          color='#FF8A65'
        />
        <StatCard
          label={overdueCount > 0 ? '逾期订单' : '进行中'}
          value={overdueCount > 0 ? overdueCount : activeOrders.length}
          subLabel={overdueCount > 0 ? '需尽快处理' : '创作中'}
          color={overdueCount > 0 ? '#F87171' : '#34D399'}
        />
      </View>

      <View className={styles.filterSection}>
        <ScrollView scrollX className={styles.filterScroll} enhanced showScrollbar={false}>
          {statusFilters.map((filter) => (
            <View
              key={filter.key}
              className={classnames(
                styles.filterItem,
                currentOrderFilter === filter.key && styles.filterItemActive
              )}
              onClick={() => setOrderFilter(filter.key)}
            >
              <Text
                className={classnames(
                  styles.filterText,
                  currentOrderFilter === filter.key && styles.filterTextActive
                )}
              >
                {filter.label}
              </Text>
              <Text
                className={classnames(
                  styles.filterText,
                  styles.filterCount,
                  currentOrderFilter === filter.key && styles.filterTextActive
                )}
              >
                {getFilterCount(filter.key)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className={styles.orderList}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <EmptyState
            title={searchKeyword ? '没有匹配的订单' : '暂无订单'}
            description={searchKeyword ? '试试其他关键词搜索吧' : '点击右上角 + 号创建你的第一个订单'}
          />
        )}
      </View>
    </View>
  );
};

export default BoardPage;
