/**
 * Admin Code Management Screen
 *
 * Allows administrators to generate and manage admin registration codes.
 */

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  createAdminCode,
  deactivateAdminCode,
  getActiveAdminCodes,
} from "../../src/services/adminCodeService";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { AdminCode } from "../../src/types/adminCode";

export default function AdminCodesScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useSubscriptionStore((state) => state.isAdmin);

  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [maxUses, setMaxUses] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [description, setDescription] = useState("");

  const styles = getStyles(isDark);

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert(
        t("common.error"),
        "You must be an administrator to access this page"
      );
      router.back();
    }
  }, [isAdmin, router, t]);

  // Load admin codes
  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const activeCodes = await getActiveAdminCodes();
      setCodes(activeCodes);
    } catch (error) {
      console.error("Error loading admin codes:", error);
      Alert.alert(t("common.error"), "Failed to load admin codes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;

    try {
      setGenerating(true);

      const options = {
        maxUses: parseInt(maxUses) || 1,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        description: description || undefined,
      };

      const newCode = await createAdminCode(user.uid, options);

      Alert.alert(
        t("adminCodes.generate.success"),
        `Code: ${newCode.code}\n\nCopy this code to share with new administrators.`
      );

      // Reset form
      setMaxUses("1");
      setExpiresInDays("");
      setDescription("");

      // Reload codes
      await loadCodes();
    } catch (error) {
      console.error("Error generating admin code:", error);
      Alert.alert(t("common.error"), t("adminCodes.generate.error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t("common.success"), t("adminCodes.list.copied"));
  };

  const handleDeactivateCode = async (code: string) => {
    Alert.alert(
      t("common.confirm"),
      `Are you sure you want to deactivate code ${code}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("adminCodes.list.deactivate"),
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateAdminCode(code);
              await loadCodes();
              Alert.alert(t("common.success"), "Code deactivated successfully");
            } catch (error) {
              console.error("Error deactivating code:", error);
              Alert.alert(t("common.error"), "Failed to deactivate code");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("adminCodes.list.never");
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderCodeItem = ({ item }: { item: AdminCode }) => {
    const isExpired =
      item.expiresAt && new Date(item.expiresAt) < new Date();

    return (
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <Text style={styles.codeText}>{item.code}</Text>
          <View
            style={[
              styles.statusBadge,
              isExpired ? styles.statusExpired : styles.statusActive,
            ]}
          >
            <Text style={styles.statusText}>
              {isExpired
                ? t("adminCodes.list.expired")
                : t("adminCodes.list.active")}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.codeDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("adminCodes.list.uses")}:
            </Text>
            <Text style={styles.detailValue}>
              {item.currentUses} /{" "}
              {item.maxUses === -1
                ? t("adminCodes.list.unlimited")
                : item.maxUses}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("adminCodes.list.expires")}:
            </Text>
            <Text style={styles.detailValue}>{formatDate(item.expiresAt)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("adminCodes.list.created")}:
            </Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCopyCode(item.code)}
          >
            <Ionicons
              name="copy-outline"
              size={18}
              color={isDark ? "#fff" : "#000"}
            />
            <Text style={styles.actionButtonText}>
              {t("adminCodes.list.copy")}
            </Text>
          </TouchableOpacity>

          {!isExpired && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deactivateButton]}
              onPress={() => handleDeactivateCode(item.code)}
            >
              <Ionicons name="ban-outline" size={18} color="#FF3B30" />
              <Text style={styles.deactivateButtonText}>
                {t("adminCodes.list.deactivate")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("adminCodes.title"),
          headerBackTitle: t("common.back"),
        }}
      />

      <ScrollView style={styles.container}>
        {/* Generate Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("adminCodes.generate.title")}
          </Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("adminCodes.generate.maxUses")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("adminCodes.generate.maxUsesPlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={maxUses}
                onChangeText={setMaxUses}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("adminCodes.generate.expiresInDays")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("adminCodes.generate.expiresInDaysPlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={expiresInDays}
                onChangeText={setExpiresInDays}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t("adminCodes.generate.description")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("adminCodes.generate.descriptionPlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity
              style={[styles.generateButton, generating && styles.buttonDisabled]}
              onPress={handleGenerateCode}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>
                  {t("adminCodes.generate.generateButton")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Codes List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("adminCodes.list.title")}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : codes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="gift-outline"
                size={64}
                color={isDark ? "#444" : "#ccc"}
              />
              <Text style={styles.emptyTitle}>
                {t("adminCodes.list.emptyTitle")}
              </Text>
              <Text style={styles.emptyMessage}>
                {t("adminCodes.list.emptyMessage")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={codes}
              renderItem={renderCodeItem}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f5f5f5",
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#2c2c2e" : "#f9f9f9",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    generateButton: {
      backgroundColor: "#007AFF",
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    generateButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginTop: 16,
    },
    emptyMessage: {
      fontSize: 14,
      color: isDark ? "#888" : "#999",
      marginTop: 8,
      textAlign: "center",
    },
    listContainer: {
      gap: 12,
    },
    codeCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    codeText: {
      fontSize: 16,
      fontWeight: "bold",
      fontFamily: "monospace",
      color: isDark ? "#fff" : "#000",
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusActive: {
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
    },
    statusExpired: {
      backgroundColor: isDark ? "#2C1618" : "#FEE",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#4ADE80" : "#28A745",
    },
    description: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      marginBottom: 12,
      fontStyle: "italic",
    },
    codeDetails: {
      gap: 8,
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    detailLabel: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    codeActions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: isDark ? "#2c2c2e" : "#f9f9f9",
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    deactivateButton: {
      backgroundColor: isDark ? "#2C1618" : "#FEE",
      borderColor: isDark ? "#5C2B2E" : "#FCC",
    },
    deactivateButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FF3B30",
    },
  });
