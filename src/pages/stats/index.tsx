import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import { useAppStore } from '@/store/useAppStore';
import { ORDER_STATUS_MAP, OrderStatus } from '@/types';
import { formatPrice, daysUntilDeadline } from '@/utils';
import StatCard from '@/components/StatCard';
import dayjs from 'dayjs';
import styles from './index.module.scss';

const StatsPage: React.FC = () => {
  const orders = useAppStore((s) => s.orders);
  const getMonthlyStats = useAppStore((s) => s.getMonthlyStats);
  const getOverdueOrders = useAppStore((s) => s.getOverdueOrders);
  const getTotalRevenue = useAppStore((s) => s.getTotalRevenue);
  const getPendingRevenue = useAppStore((s) => s.getPendingRevenue);
  const getAvgOrderValue = useAppStore((s) => s.getAvgOrderValue);
  const getStatusCounts = useAppStore((s) => s.getStatusCounts);

  const monthlyStats = useMemo(() => getMonthlyStats(), [orders, getMonthlyStats]);
  const overdueOrders = useMemo(() => getOverdueOrders(), [orders, getOverdueOrders]);
  const totalRevenue = useMemo(() => getTotalRevenue(), [orders, getTotalRevenue]);
  const pendingRevenue = useMemo(() => getPendingRevenue(), [orders, getPendingRevenue]);
  const avgOrderValue = useMemo(() => getAvgOrderValue(), [orders, getAvgOrderValue]);
  const statusCounts = useMemo(() => getStatusCounts(), [orders, getStatusCounts]);

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
  const pendingCount = overdueOrders.length;

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
          value={statusCounts.all}
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
            <View className={`${styles.chartTab} ${styles.chartTabActive}`}>近6个月</View>
          </View>
        </View>

        {maxRevenue > 1 ? (
          <View className={styles.chartBars}>
            {monthlyStats.map((m, i) => {
              const heightPercent = (m.revenue / maxRevenue) * 100;
              const monthLabel = m.month;
              const isCurrent = i === monthlyStats.length - 1;
              return (
                <View key={m.month} className={styles.chartBarWrap}>
                  <Text className={styles.chartBarValue}>
                    {m.revenue >= 10000
                      ? `${(m.revenue / 10000).toFixed(1)}w`
                      : m.revenue >= 1000
                      ? `${(m.revenue / 1000).toFixed(0)}k`
                      : m.revenue > 0
                      ? `¥${m.revenue}`
                      : '-'}
                  </Text>
                  <View
                    className={`${styles.chartBar} ${isCurrent ? styles.chartBarCurrent : ''}`}
                    style={{ height: `${Math.max(heightPercent, m.revenue > 0 ? 5 : 2)}%` }}
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
        ) : (
          <View style={{ padding: '48rpx 0', textAlign: 'center' }}>
            <Text style={{ fontSize: '56rpx' }}>📭</Text>
            <View style={{ fontSize: '26rpx', color: '#9ca3af', marginTop: '12rpx' }}>
              暂无已交付收入，完成订单后将显示趋势
            </View>
          </View>
        )}

        <View className={styles.chartLegend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#7B5CFF' }} />
            <Text className={styles.legendText}>历史月份</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#FF8A65' }} />
            <Text className={styles.legendText}>当前月份（{currentMonth}）</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#F3F4F6' }} />
            <Text className={styles.legendText}>待收 {formatPrice(pendingRevenue)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.statusSection}>
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24rpx' }}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937', marginRight: '8rpx' }}>📋</Text>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937' }}>订单状态分布</Text>
          </View>
          <Text style={{ fontSize: '22rpx', color: '#9ca3af' }}>共 {statusCounts.all} 单</Text>
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
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24rpx' }}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937', marginRight: '8rpx' }}>⚠️</Text>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: '#1F2937' }}>逾期订单预警</Text>
          </View>
          {pendingCount > 0 && (
            <Text style={{
              fontSize: '22rpx',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#ef4444',
              borderRadius: '100rpx',
              padding: '6rpx 20rpx'
            }}>
              {pendingCount} 单
            </Text>
          )}
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
