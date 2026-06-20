import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
  bgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subLabel, color, bgColor }) => {
  return (
    <View className={styles.card} style={bgColor ? { backgroundColor: bgColor } : {}}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={color ? { color } : {}}>
          {value}
        </Text>
      </View>
      {subLabel && <Text className={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
};

export default StatCard;
