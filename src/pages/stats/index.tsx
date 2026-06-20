import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useAppStore } from '@/store/useAppStore';
import { ORDER_STATUS_MAP, OrderStatus } from '@/types';
import { formatPrice, daysUntilDeadline } from '@/utils';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const { orders, monthlyStats, getOverdueOrders } = useAppStore();

  const totalRevenue = useMemo(
    () => monthlyStats.reduce((sum, m) => sum + m.revenue, 0),
    [monthlyStats]
  );

  const thisMonthRevenue = monthlyStats[monthlyStats.length - 1]?.revenue || 0;
  const lastMonthRevenue = monthlyStats[monthlyStats.length - 2]?.revenue || 0;
  const trendPercent =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
      ? 100
      : 0;

  const maxRevenue = useMemo(() => Math.max(...monthlyStats.map((m) => m.revenue), 1), [monthlyStats]);

  const currentMonth = dayjs().format('M月');

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      consultation: 0,
      draft: 0,
      lineart: 0,
      coloring: 0,
      revision: 0,
      delivered: 0
    };
    orders.forEach((o) => {
      counts[o.status]++;
    });
    return counts;
  }, [orders]);

  const overdueOrders = getOverdueOrders();

  const totalOrderCount = orders.length;
  const avgOrderValue =
    totalOrderCount > 0
      ? Math.round(orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.price, 0) / Math.max(1, statusCounts.delivered))
      : 0;

  return (
    <View className={styles.page}>
      <View className={styles.heroHeader}>
        <Text className={styles.heroTitle}>💰 累计总收入</Text>
        <View className={styles.heroAmount}>
          <Text className={styles.heroAmountPrefix}>¥</Text>
          <Text>{totalRevenue.toLocaleString('zh-CN')}</Text>
        </View>
        <View className={styles.heroSub}>
          <Text>本月收入 {formatPrice(thisMonthRevenue)}</Text>
          <View className={styles.heroTrend}>
            <Text>{trendPercent >= 0 ? '📈' : '📉'}</Text>
            <Text>{trendPercent >= 0 ? '+' : ''}{trendPercent}% vs 上月</Text>
          </View>
        </View>
      </View>

      <View className={styles.statCards}>
        <StatCard
          label='总订单'
          value={totalOrderCount}
          subLabel='累计接单数'
          color='#7B5CFF'
        />
        <StatCard
          label='已交付'
          value={statusCounts.delivered}
          subLabel='圆满完成'
          color='#34D399'
        />
        <StatCard
          label='客单价'
          value={formatPrice(avgOrderValue)}
          subLabel='平均每单'
          color='#FF8A65'
        />
      </View>

      <View className={styles.chartCard}>
        <View className={styles.chartHeader}>
          <View className={styles.chartTitle}>
            <Text className={styles.chartTitleIcon}>📊</Text>
            <Text>月度收入趋势</Text>
          </View>
          <View className={styles.chartTabs}>
            <View className={styles.chartTab}>{/* 全部 */}</View>
            <View className={`${styles.chartTab} ${styles.chartTabActive}`}>近6个月</View>
          </View>
        </View>

        <View className={styles.chartBars}>
          {monthlyStats.map((m, i) => {
            const heightPercent = (m.revenue / maxRevenue) * 100;
            const monthLabel = dayjs(m.month).format('M月');
            const isCurrent = i === monthlyStats.length - 1;
            return (
              <View key={m.month} className={styles.chartBarWrap}>
                <Text className={styles.chartBarValue}>
                  {m.revenue >= 10000
                    ? `${(m.revenue / 10000).toFixed(1)}w`
                    : `${(m.revenue / 1000).toFixed(0)}k`}
                </Text>
                <View
                  className={`${styles.chartBar} ${isCurrent ? styles.chartBarCurrent : ''}`}
                  style={{ height: `${Math.max(heightPercent, 3)}%` }}
                />
                <Text
                  className={styles.chartBarLabel}
                  style={isCurrent ? { color: '#7B5CFF', fontWeight: '600' } : {}}
                >
                  {monthLabel}
                </Text>
              </View>
            );
          })}
        </View>

        <View className={styles.chartLegend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#7B5CFF' }} />
            <Text className={styles.legendText}>历史月份</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#FF8A65' }} />
            <Text className={styles.legendText}>当前月份（{currentMonth}）</Text>
          </View>
        </View>
      </View>

      <View className={styles.statusSection}>
        <View style={{ display: 'flex', alignItems: 'center', marginBottom: '24rpx' }}>
          <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937', marginRight: '8rpx' }}>📋</Text>
          <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937' }}>订单状态分布</Text>
        </View>
        <View className={styles.statusGrid}>
          {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map((status) => (
            <View key={status} className={styles.statusCard}>
              <View
                className={styles.statusDot}
                style={{ backgroundColor: ORDER_STATUS_MAP[status].color }}
              />
              <Text className={styles.statusCount}>{statusCounts[status]}</Text>
              <Text className={styles.statusLabel}>{ORDER_STATUS_MAP[status].label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.overdueSection}>
        <View style={{ display: 'flex', alignItems: 'center', marginBottom: '24rpx' }}>
          <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937', marginRight: '8rpx' }}>⚠️</Text>
          <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937' }}>逾期订单预警</Text>
        </View>

        {overdueOrders.length > 0 ? (
          <View className={styles.overdueCard}>
            <View className={styles.overdueHeader}>
              <View className={styles.overdueTitle}>
                <Text className={styles.overdueIcon}>🚨</Text>
                <Text>有 {overdueOrders.length} 个订单需要关注</Text>
              </View>
              <View className={styles.overdueBadge}>紧急</View>
            </View>
            {overdueOrders.map((order) => {
              const overdueDays = Math.abs(daysUntilDeadline(order.deadline));
              return (
                <View key={order.id} className={styles.overdueItem}>
                  <Text className={styles.overdueItemTitle}>{order.title}</Text>
                  <View className={styles.overdueItemMeta}>
                    <Text className={styles.overdueItemInfo}>
                      {order.clientName} · {formatPrice(order.price)}
                    </Text>
                    <Text className={styles.overdueDays}>逾期 {overdueDays} 天</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16rpx',
              padding: '48rpx 32rpx',
              textAlign: 'center',
              boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)'
            }}
          >
            <Text style={{ fontSize: '64rpx' }}>✅</Text>
            <Text
              style={{
                fontSize: '28rpx',
                fontWeight: '600',
                color: '#1F2937',
                marginTop: '16rpx',
                display: 'block'
              }}
            >
              一切尽在掌握
            </Text>
            <Text style={{ fontSize: '24rpx', color: '#9CA3AF', marginTop: '8rpx' }}>
              当前没有逾期订单，继续保持！
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StatsPage;
