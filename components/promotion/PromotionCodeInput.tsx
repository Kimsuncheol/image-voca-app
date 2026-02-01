/**
 * Promotion Code Input Component
 *
 * Reusable component for entering and redeeming promotion codes.
 * Includes validation feedback, loading states, and error handling.
 */

import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { usePromotionCodeStore } from '../../src/stores/promotionCodeStore';
import type { PromotionBenefit } from '../../src/types/promotionCode';

interface PromotionCodeInputProps {
  userId: string;
  onSuccess?: (benefit: PromotionBenefit) => void;
  style?: ViewStyle;
}

export function PromotionCodeInput({
  userId,
  onSuccess,
  style,
}: PromotionCodeInputProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const {
    codeInput,
    validationError,
    redeeming,
    redemptionSuccess,
    redemptionMessage,
    redeemedBenefit,
    setCodeInput,
    validateAndRedeemCode,
    resetState,
    clearError,
  } = usePromotionCodeStore();

  // Handle successful redemption
  useEffect(() => {
    if (redemptionSuccess && redeemedBenefit) {
      Alert.alert(
        t('promotion.success.title'),
        redemptionMessage || t('promotion.success.message'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              resetState();
              onSuccess?.(redeemedBenefit);
            },
          },
        ]
      );
    }
  }, [redemptionSuccess, redeemedBenefit, redemptionMessage, onSuccess, t, resetState]);

  const handleRedeem = async () => {
    if (!codeInput.trim()) {
      return;
    }

    const success = await validateAndRedeemCode(userId);

    // Success handling is done in useEffect above
    // Errors are automatically set in the store
  };

  const canRedeem = codeInput.length === 8 && !redeeming && !validationError;

  return (
    <View style={[styles.container, style]}>
      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            validationError ? styles.inputError : undefined,
          ]}
          value={codeInput}
          onChangeText={setCodeInput}
          placeholder={t('promotion.input.placeholder')}
          placeholderTextColor={isDark ? '#666' : '#999'}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          editable={!redeeming}
        />

        {redeeming && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            color={isDark ? '#fff' : '#000'}
          />
        )}
      </View>

      {/* Error Message */}
      {validationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      {/* Redeem Button */}
      <TouchableOpacity
        style={[
          styles.button,
          !canRedeem && styles.buttonDisabled,
        ]}
        onPress={handleRedeem}
        disabled={!canRedeem}
      >
        {redeeming ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {t('promotion.button.redeem')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        {t('promotion.helper.format')}
      </Text>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    inputContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 2,
      color: isDark ? '#fff' : '#000',
      textAlign: 'center',
    },
    inputError: {
      borderColor: '#ff4444',
    },
    loadingIndicator: {
      position: 'absolute',
      right: 16,
      top: 14,
    },
    errorContainer: {
      backgroundColor: isDark ? '#331111' : '#ffebee',
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
    },
    errorText: {
      color: '#ff4444',
      fontSize: 13,
      textAlign: 'center',
    },
    button: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      backgroundColor: isDark ? '#333' : '#ccc',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    helperText: {
      marginTop: 8,
      fontSize: 12,
      color: isDark ? '#999' : '#666',
      textAlign: 'center',
    },
  });
