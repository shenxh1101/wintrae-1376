import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { ComplexityLevel, UrgencyLevel, LicenseScope, COMPLEXITY_MAP, URGENCY_MAP, LICENSE_MAP } from '@/types';
import { calculateQuote, formatPrice } from '@/utils';
import QuoteCard from '@/components/QuoteCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type QuoteTab = 'all' | 'pending' | 'accepted' | 'rejected';

const QuotesPage: React.FC = () => {
  const { quotes, addQuote } = useAppStore();
  const [activeTab, setActiveTab] = useState<QuoteTab>('all');

  const [basePrice, setBasePrice] = useState<number>(1500);
  const [complexity, setComplexity] = useState<ComplexityLevel>('medium');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [license, setLicense] = useState<LicenseScope>('personal');

  const calcResult = useMemo(
    () => calculateQuote(basePrice, complexity, urgency, license),
    [basePrice, complexity, urgency, license]
  );

  const filteredQuotes = useMemo(() => {
    if (activeTab === 'all') return quotes;
    return quotes.filter((q) => q.status === activeTab);
  }, [quotes, activeTab]);

  const tabCounts = useMemo(() => ({
    all: quotes.length,
    pending: quotes.filter((q) => q.status === 'pending').length,
    accepted: quotes.filter((q) => q.status === 'accepted').length,
    rejected: quotes.filter((q) => q.status === 'rejected').length
  }), [quotes]);

  const pendingTotal = useMemo(
    () => quotes.filter((q) => q.status === 'pending').reduce((sum, q) => sum + q.totalPrice, 0),
    [quotes]
  );

  const handleGenerateQuote = () => {
    console.log('[QuotesPage] Generate quote:', { basePrice, complexity, urgency, license, calcResult });
    Taro.showActionSheet({
      itemList: ['保存为草稿报价单', '复制报价金额'],
      success: (res) => {
        if (res.tapIndex === 0) {
          addQuote({
            clientName: '新客户',
            projectName: '未命名项目',
            basePrice,
            complexityLevel: complexity,
            complexityPrice: calcResult.complexityPrice,
            urgencyLevel: urgency,
            urgencyPrice: calcResult.urgencyPrice,
            licenseScope: license,
            licensePrice: calcResult.licensePrice,
            totalPrice: calcResult.totalPrice,
            status: 'pending',
            note: `基础 ¥${basePrice} + 复杂度 + 加急 + 授权`
          });
          Taro.showToast({ title: '报价单已保存', icon: 'success' });
        } else if (res.tapIndex === 1) {
          Taro.setClipboardData({
            data: formatPrice(calcResult.totalPrice),
            success: () => Taro.showToast({ title: '金额已复制', icon: 'success' })
          });
        }
      }
    });
  };

  const segments: Array<{
    key: string;
    label: string;
    subLabel?: string;
    options: Array<{ key: string; label: string; sub?: string }>;
    value: string;
    onChange: (v: any) => void;
  }> = [
    {
      key: 'complexity',
      label: '复杂度等级',
      options: Object.entries(COMPLEXITY_MAP).map(([k, v]) => ({
        key: k,
        label: v.label,
        sub: `×${v.multiplier}`
      })),
      value: complexity,
      onChange: setComplexity
    },
    {
      key: 'urgency',
      label: '加急程度',
      options: Object.entries(URGENCY_MAP).map(([k, v]) => ({
        key: k,
        label: v.label,
        sub: v.extraFee > 0 ? `+¥${v.extraFee}` : '无附加'
      })),
      value: urgency,
      onChange: setUrgency
    },
    {
      key: 'license',
      label: '授权范围',
      options: Object.entries(LICENSE_MAP).map(([k, v]) => ({
        key: k,
        label: v.label,
        sub: `×${v.multiplier}`
      })),
      value: license,
      onChange: setLicense
    }
  ];

  const tabs: Array<{ key: QuoteTab; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'accepted', label: '已接受' },
    { key: 'rejected', label: '已拒绝' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <Text className={styles.headerTitle}>🧮 报价单</Text>
          <Button className={styles.newQuoteBtn} onClick={handleGenerateQuote}>
            <Text className={styles.newQuoteBtnText}>生成报价</Text>
          </Button>
        </View>

        <View className={styles.calculatorCard}>
          <View className={styles.calcTitle}>
            <Text className={styles.calcTitleIcon}>💡</Text>
            <Text>智能报价计算器</Text>
          </View>

          <View className={styles.calcField}>
            <Text className={styles.calcLabel}>基础价格</Text>
            <View className={styles.priceInputWrap}>
              <Text className={styles.pricePrefix}>¥</Text>
              <Input
                className={styles.priceInput}
                type='digit'
                value={String(basePrice)}
                onInput={(e) => setBasePrice(Number(e.detail.value) || 0)}
              />
            </View>
          </View>

          {segments.map((seg) => (
            <View key={seg.key} className={styles.calcField}>
              <Text className={styles.calcLabel}>{seg.label}</Text>
              <View className={styles.segmentWrap}>
                {seg.options.map((opt) => (
                  <View
                    key={opt.key}
                    className={classnames(
                      styles.segmentItem,
                      seg.value === opt.key && styles.segmentItemActive
                    )}
                    onClick={() => seg.onChange(opt.key)}
                  >
                    <Text
                      className={classnames(
                        styles.segmentText,
                        seg.value === opt.key && styles.segmentTextActive
                      )}
                    >
                      {opt.label}
                    </Text>
                    {opt.sub && (
                      <Text
                        className={classnames(
                          styles.segmentSubText,
                          seg.value === opt.key && styles.segmentTextActive
                        )}
                      >
                        {opt.sub}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View className={styles.resultBox}>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>基础价格</Text>
              <Text className={styles.resultValue}>{formatPrice(basePrice)}</Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>复杂度加价</Text>
              <Text className={classnames(styles.resultValue, calcResult.complexityPrice > 0 && styles.resultValueAdd)}>
                {calcResult.complexityPrice > 0 ? '+' : ''}{formatPrice(calcResult.complexityPrice)}
              </Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>加急费用</Text>
              <Text className={classnames(styles.resultValue, calcResult.urgencyPrice > 0 && styles.resultValueAdd)}>
                {calcResult.urgencyPrice > 0 ? '+' : ''}{formatPrice(calcResult.urgencyPrice)}
              </Text>
            </View>
            <View className={styles.resultRow}>
              <Text className={styles.resultLabel}>授权加价</Text>
              <Text className={classnames(styles.resultValue, calcResult.licensePrice > 0 && styles.resultValueAdd)}>
                {calcResult.licensePrice > 0 ? '+' : ''}{formatPrice(calcResult.licensePrice)}
              </Text>
            </View>
            <View className={classnames(styles.resultRow, styles.totalRow)}>
              <Text className={styles.totalLabel}>合计报价</Text>
              <Text className={styles.totalValue}>{formatPrice(calcResult.totalPrice)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text
              className={classnames(
                styles.tabCount,
                activeTab === tab.key && styles.tabCountActive
              )}
            >
              {tabCounts[tab.key]}
            </Text>
            <Text className={styles.tabLabel}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.quoteList}>
        <View className={styles.listHeader}>
          <View className={styles.listTitle}>
            <Text className={styles.listTitleIcon}>📋</Text>
            <Text>历史报价</Text>
          </View>
          {activeTab === 'pending' && pendingTotal > 0 && (
            <Text style={{ fontSize: '24rpx', color: '#FF8A65', fontWeight: '500' }}>
              待确认：{formatPrice(pendingTotal)}
            </Text>
          )}
        </View>

        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((quote) => <QuoteCard key={quote.id} quote={quote} />)
        ) : (
          <EmptyState
            title='暂无报价单'
            description='使用上方计算器生成你的第一份报价单'
          />
        )}
      </View>
    </View>
  );
};

export default QuotesPage;
