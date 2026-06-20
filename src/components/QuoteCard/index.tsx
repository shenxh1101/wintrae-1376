import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { Quote, COMPLEXITY_MAP, URGENCY_MAP, LICENSE_MAP } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice, formatDate } from '@/utils';
import { useAppStore } from '@/store/useAppStore';
import styles from './index.module.scss';

interface QuoteCardProps {
  quote: Quote;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
  const updateQuoteStatus = useAppStore((s) => s.updateQuoteStatus);

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[QuoteCard] Accept quote:', quote.id);
    updateQuoteStatus(quote.id, 'accepted');
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[QuoteCard] Reject quote:', quote.id);
    updateQuoteStatus(quote.id, 'rejected');
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <StatusBadge type='quote' status={quote.status} />
          <Text className={styles.date}>{formatDate(quote.createdAt)}</Text>
        </View>
        <Text className={styles.totalPrice}>{formatPrice(quote.totalPrice)}</Text>
      </View>

      <Text className={styles.projectName}>{quote.projectName}</Text>
      <Text className={styles.clientName}>
        <Text className={styles.clientLabel}>客户：</Text>
        {quote.clientName}
      </Text>

      <View className={styles.priceBreakdown}>
        <View className={styles.priceRow}>
          <View className={styles.priceLabelWrap}>
            <Text className={styles.priceLabelDot} style={{ backgroundColor: '#A78BFA' }} />
            <Text className={styles.priceLabel}>基础价格</Text>
          </View>
          <Text className={styles.priceValue}>{formatPrice(quote.basePrice)}</Text>
        </View>
        <View className={styles.priceRow}>
          <View className={styles.priceLabelWrap}>
            <Text className={styles.priceLabelDot} style={{ backgroundColor: '#60A5FA' }} />
            <Text className={styles.priceLabel}>
              复杂度（{COMPLEXITY_MAP[quote.complexityLevel].label}）
            </Text>
          </View>
          <Text className={classnames(styles.priceValue, quote.complexityPrice > 0 && styles.priceAdd)}>
            {quote.complexityPrice > 0 ? '+' : ''}{formatPrice(quote.complexityPrice)}
          </Text>
        </View>
        <View className={styles.priceRow}>
          <View className={styles.priceLabelWrap}>
            <Text className={styles.priceLabelDot} style={{ backgroundColor: '#FF8A65' }} />
            <Text className={styles.priceLabel}>
              加急（{URGENCY_MAP[quote.urgencyLevel].label}）
            </Text>
          </View>
          <Text className={classnames(styles.priceValue, quote.urgencyPrice > 0 && styles.priceAdd)}>
            {quote.urgencyPrice > 0 ? '+' : ''}{formatPrice(quote.urgencyPrice)}
          </Text>
        </View>
        <View className={styles.priceRow}>
          <View className={styles.priceLabelWrap}>
            <Text className={styles.priceLabelDot} style={{ backgroundColor: '#34D399' }} />
            <Text className={styles.priceLabel}>
              授权（{LICENSE_MAP[quote.licenseScope].label}）
            </Text>
          </View>
          <Text className={classnames(styles.priceValue, quote.licensePrice > 0 && styles.priceAdd)}>
            {quote.licensePrice > 0 ? '+' : ''}{formatPrice(quote.licensePrice)}
          </Text>
        </View>
      </View>

      {quote.note && (
        <View className={styles.note}>
          <Text className={styles.noteLabel}>备注</Text>
          <Text className={styles.noteText}>{quote.note}</Text>
        </View>
      )}

      {quote.status === 'pending' && (
        <View className={styles.actions}>
          <Button className={classnames(styles.btn, styles.btnReject)} onClick={handleReject}>
            <Text className={styles.btnRejectText}>拒绝</Text>
          </Button>
          <Button className={classnames(styles.btn, styles.btnAccept)} onClick={handleAccept}>
            <Text className={styles.btnAcceptText}>接受报价</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

export default QuoteCard;
