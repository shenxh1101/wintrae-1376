import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, showLabel = true, height = 12 }) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <View className={styles.container}>
      <View className={styles.barOuter} style={{ height: `${height}rpx` }}>
        <View
          className={styles.barInner}
          style={{ width: `${safeProgress}%` }}
        />
      </View>
      {showLabel && (
        <Text className={styles.label}>{safeProgress}%</Text>
      )}
    </View>
  );
};

export default ProgressBar;
