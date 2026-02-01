/**
 * Promotion Codes Admin Dashboard
 *
 * Admin screen for generating, viewing, and managing promotion codes.
 * Includes code generation form, active codes list, and basic analytics.
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  generatePromotionCodes,
  getAllPromotionCodes,
  deactivateCode,
} from '../../src/services/promotionCodeService';
import type {
  PromotionCode,
  CodeGenerationRequest,
  PlanType,
} from '../../src/types/promotionCode';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';

export default function PromotionCodesAdmin() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const styles = getStyles(isDark);

  // Auth check
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Generation form state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('voca_unlimited');
  const [isPermanent, setIsPermanent] = useState(true);
  const [durationDays, setDurationDays] = useState('30');
  const [maxUses, setMaxUses] = useState('100');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [description, setDescription] = useState('');
  const [codeCount, setCodeCount] = useState('1');
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // Codes list state
  const [codes, setCodes] = useState<PromotionCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Admin check error:', error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Load codes on mount
  useEffect(() => {
    if (isAdmin) {
      loadCodes();
    }
  }, [isAdmin]);

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const allCodes = await getAllPromotionCodes();
      setCodes(allCodes.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Load codes error:', error);
      Alert.alert('Error', 'Failed to load promotion codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const count = parseInt(codeCount);
    if (isNaN(count) || count < 1 || count > 100) {
      Alert.alert('Error', 'Please enter a valid count (1-100)');
      return;
    }

    const request: CodeGenerationRequest = {
      eventPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      benefit: {
        type: 'subscription_upgrade',
        planId: selectedPlan,
        isPermanent,
        durationDays: isPermanent ? undefined : parseInt(durationDays),
      },
      maxUses: parseInt(maxUses),
      maxUsesPerUser: parseInt(maxUsesPerUser),
      description: description.trim(),
      count,
    };

    setGenerating(true);
    try {
      const result = await generatePromotionCodes(request, user!.uid);
      setGeneratedCodes(result.codes);
      Alert.alert(
        'Success',
        `Generated ${result.codes.length} promotion codes successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadCodes();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate codes');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivateCode = async (code: string) => {
    Alert.alert(
      'Deactivate Code',
      `Are you sure you want to deactivate ${code}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateCode(code);
              Alert.alert('Success', 'Code deactivated');
              loadCodes();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to deactivate code');
            }
          },
        },
      ]
    );
  };

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', `Code ${code} copied to clipboard`);
  };

  if (checkingAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Access Denied',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={64} color={isDark ? '#666' : '#ccc'} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You don't have permission to access this page.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Promotion Codes Admin',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Generation Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate Promotion Codes</Text>

          {/* Event Period */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Event Period</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateText}>
                  {startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateSeparator}>to</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateText}>
                  {endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {/* Plan Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subscription Plan</Text>
            <View style={styles.planButtons}>
              <TouchableOpacity
                style={[
                  styles.planButton,
                  selectedPlan === 'voca_unlimited' && styles.planButtonActive,
                ]}
                onPress={() => setSelectedPlan('voca_unlimited')}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    selectedPlan === 'voca_unlimited' && styles.planButtonTextActive,
                  ]}
                >
                  Voca Unlimited
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planButton,
                  selectedPlan === 'voca_speaking' && styles.planButtonActive,
                ]}
                onPress={() => setSelectedPlan('voca_speaking')}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    selectedPlan === 'voca_speaking' && styles.planButtonTextActive,
                  ]}
                >
                  Voca + Speaking
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Permanent/Temporary */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration Type</Text>
            <View style={styles.planButtons}>
              <TouchableOpacity
                style={[
                  styles.planButton,
                  isPermanent && styles.planButtonActive,
                ]}
                onPress={() => setIsPermanent(true)}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    isPermanent && styles.planButtonTextActive,
                  ]}
                >
                  Permanent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planButton,
                  !isPermanent && styles.planButtonActive,
                ]}
                onPress={() => setIsPermanent(false)}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    !isPermanent && styles.planButtonTextActive,
                  ]}
                >
                  Temporary
                </Text>
              </TouchableOpacity>
            </View>
            {!isPermanent && (
              <TextInput
                style={styles.input}
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder="Duration in days"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="number-pad"
              />
            )}
          </View>

          {/* Usage Limits */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Total Uses (-1 for unlimited)</Text>
            <TextInput
              style={styles.input}
              value={maxUses}
              onChangeText={setMaxUses}
              placeholder="100"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Uses Per User</Text>
            <TextInput
              style={styles.input}
              value={maxUsesPerUser}
              onChangeText={setMaxUsesPerUser}
              placeholder="1"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="number-pad"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Launch 2026 promotion"
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Code Count */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of Codes to Generate</Text>
            <TextInput
              style={styles.input}
              value={codeCount}
              onChangeText={setCodeCount}
              placeholder="1"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="number-pad"
            />
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.buttonDisabled]}
            onPress={handleGenerateCodes}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Codes</Text>
            )}
          </TouchableOpacity>

          {/* Generated Codes Display */}
          {generatedCodes.length > 0 && (
            <View style={styles.generatedContainer}>
              <Text style={styles.generatedTitle}>Generated Codes:</Text>
              {generatedCodes.map((code, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.generatedCode}
                  onPress={() => copyCode(code)}
                >
                  <Text style={styles.generatedCodeText}>{code}</Text>
                  <Ionicons name="copy-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Active Codes List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Codes</Text>
            <TouchableOpacity onPress={loadCodes} disabled={loadingCodes}>
              <Ionicons
                name="refresh"
                size={24}
                color={isDark ? '#fff' : '#000'}
              />
            </TouchableOpacity>
          </View>

          {loadingCodes ? (
            <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
          ) : codes.length === 0 ? (
            <Text style={styles.emptyText}>No promotion codes yet</Text>
          ) : (
            codes.map((code) => (
              <View key={code.code} style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <TouchableOpacity onPress={() => copyCode(code.code)}>
                    <Text style={styles.codeText}>{code.code}</Text>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.statusBadge,
                      code.status === 'active'
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    <Text style={styles.statusText}>{code.status}</Text>
                  </View>
                </View>

                <Text style={styles.codeDescription}>{code.description}</Text>

                <View style={styles.codeDetails}>
                  <Text style={styles.detailText}>
                    Plan: {code.benefit.planId.replace('_', ' ')}
                  </Text>
                  <Text style={styles.detailText}>
                    Uses: {code.currentUses}/{code.maxUses === -1 ? '∞' : code.maxUses}
                  </Text>
                  <Text style={styles.detailText}>
                    Expires: {new Date(code.eventPeriod.endDate).toLocaleDateString()}
                  </Text>
                </View>

                {code.status === 'active' && (
                  <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => handleDeactivateCode(code.code)}
                  >
                    <Text style={styles.deactivateButtonText}>Deactivate</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ccc' : '#666',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateButton: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    dateText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    dateSeparator: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
    },
    planButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    planButton: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    planButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    planButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    planButtonTextActive: {
      color: '#fff',
    },
    generateButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: isDark ? '#333' : '#ccc',
    },
    generateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    generatedContainer: {
      marginTop: 20,
      padding: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderRadius: 12,
    },
    generatedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 12,
    },
    generatedCode: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#000' : '#fff',
      borderRadius: 8,
      marginBottom: 8,
    },
    generatedCodeText: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      letterSpacing: 2,
    },
    codeCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    codeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    codeText: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      letterSpacing: 2,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusActive: {
      backgroundColor: '#28a745',
    },
    statusInactive: {
      backgroundColor: '#6c757d',
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    codeDescription: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 12,
    },
    codeDetails: {
      gap: 6,
      marginBottom: 12,
    },
    detailText: {
      fontSize: 13,
      color: isDark ? '#999' : '#666',
    },
    deactivateButton: {
      backgroundColor: '#dc3545',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    deactivateButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? '#666' : '#999',
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: '#007AFF',
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    backButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
