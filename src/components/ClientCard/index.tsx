import React from 'react';
import { View, Text } from '@tarojs/components';
import { Client } from '@/types';
import { formatPrice, formatDate } from '@/utils';
import styles from './index.module.scss';

interface ClientCardProps {
  client: Client;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  const getInitial = (name: string): string => {
    return name.charAt(0);
  };

  const avatarColors = [
    'linear-gradient(135deg, #7B5CFF 0%, #A78BFA 100%)',
    'linear-gradient(135deg, #FF8A65 0%, #FFAB91 100%)',
    'linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)',
    'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)',
    'linear-gradient(135deg, #F472B6 0%, #F9A8D4 100%)',
    'linear-gradient(135deg, #FBBF24 0%, #FCD34D 100%)'
  ];

  const colorIndex = client.name.length % avatarColors.length;

  return (
    <View className={styles.card}>
      <View className={styles.leftSection}>
        <View className={styles.avatar} style={{ background: avatarColors[colorIndex] }}>
          <Text className={styles.avatarText}>{getInitial(client.name)}</Text>
        </View>
        <View className={styles.infoSection}>
          <Text className={styles.name}>{client.name}</Text>
          <Text className={styles.contact}>{client.contact}</Text>
          {client.note && (
            <Text className={styles.note}>
              <Text className={styles.noteIcon}>📝 </Text>
              {client.note}
            </Text>
          )}
        </View>
      </View>

      <View className={styles.rightSection}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{client.orderCount}</Text>
          <Text className={styles.statLabel}>订单</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statValuePrimary}>{formatPrice(client.totalRevenue)}</Text>
          <Text className={styles.statLabel}>累计</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <Text className={styles.footerDate}>合作自 {formatDate(client.createdAt)}</Text>
      </View>
    </View>
  );
};

export default ClientCard;
