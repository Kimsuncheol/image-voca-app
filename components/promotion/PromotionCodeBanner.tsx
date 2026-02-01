/**
 * Promotion Code Banner Component
 *
 * Displays a banner promoting active promotion codes with
 * countdown timer and quick access to code input.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';

interface PromotionCodeBannerProps {
  eventEndDate: string; // ISO timestamp
  onPress?: () => void;
  style?: ViewStyle;
}

export function PromotionCodeBanner({
  eventEndDate,
  onPress,
  style,
}: PromotionCodeBannerProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(eventEndDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeRemaining(t('promotion.banner.expired'));
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(t('promotion.banner.daysRemaining', { days }));
      } else if (hours > 0) {
        setTimeRemaining(t('promotion.banner.hoursRemaining', { hours }));
      } else {
        setTimeRemaining(t('promotion.banner.minutesRemaining', { minutes }));
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [eventEndDate, t]);

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('promotion.banner.title')}</Text>
        <Text style={styles.subtitle}>{t('promotion.banner.subtitle')}</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeRemaining}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1a3a5a' : '#e3f2fd',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#2a4a6a' : '#90caf9',
    },
    content: {
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#90caf9' : '#1976d2',
      marginBottom: 4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#b3d9ff' : '#1976d2',
      marginBottom: 12,
      textAlign: 'center',
    },
    timerContainer: {
      backgroundColor: isDark ? '#2a4a6a' : '#1976d2',
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#fff',
    },
  });
