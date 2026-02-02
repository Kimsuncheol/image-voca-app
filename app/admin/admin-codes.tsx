/**
 * Admin Code Management Screen
 *
 * Allows administrators to generate and manage admin registration codes.
 */

import * as Clipboard from "expo-clipboard";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  deactivateAdminCode,
  getActiveAdminCodes,
} from "../../src/services/adminCodeService";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { AdminCode } from "../../src/types/adminCode";

// Import extracted components
import { ActiveCodesList, GenerationForm } from "./admin-codes/components";

export default function AdminCodesScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useSubscriptionStore((state) => state.isAdmin);

  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"generate" | "active">("generate");

  const styles = getStyles(isDark);

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert(
        t("common.error"),
        "You must be an administrator to access this page",
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
      ],
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

      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "generate" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("generate")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "generate" && styles.tabButtonTextActive,
              ]}
            >
              {t("adminCodes.generate.title")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "active" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "active" && styles.tabButtonTextActive,
              ]}
            >
              {t("adminCodes.list.title")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.tabContent}>
          {activeTab === "generate" ? (
            /* =================================================================
                GENERATION FORM TAB
                Form for creating new admin registration codes
                ================================================================= */
            <GenerationForm
              isDark={isDark}
              onCodeGenerated={loadCodes}
              t={t}
              userId={user!.uid}
            />
          ) : (
            /* =================================================================
                ACTIVE CODES LIST TAB
                Display and management of existing admin codes
                ================================================================= */
            <ActiveCodesList
              codes={codes}
              loading={loading}
              isDark={isDark}
              onCopyCode={handleCopyCode}
              onDeactivateCode={handleDeactivateCode}
              t={t}
            />
          )}
        </ScrollView>
      </View>
    </>
  );
}

/**
 * Styles for main container and tab navigation
 * Component-specific styles have been moved to their respective component files
 *
 * REMAINING STYLES:
 * - Container: Main app container
 * - Tab Navigation: Tab buttons and active states
 * - Tab Content: Content area scroll view
 *
 * REMOVED STYLES (now in components):
 * - Generation Form → GenerationForm.tsx
 * - Active Codes List → ActiveCodesList.tsx
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // =========================================================================
    // CONTAINER & LAYOUT
    // =========================================================================
    /** Main container - full screen with theme background */
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f5f5f5",
    },

    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================
    /** Tab navigation container */
    tabContainer: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#e0e0e0",
    },
    /** Individual tab button */
    tabButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderBottomWidth: 3,
      borderBottomColor: "transparent",
    },
    /** Active tab button with border indicator */
    tabButtonActive: {
      borderBottomColor: "#007AFF",
    },
    /** Tab button text */
    tabButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#666" : "#999",
    },
    /** Active tab button text */
    tabButtonTextActive: {
      color: isDark ? "#fff" : "#000",
    },
    /** Tab content scroll view */
    tabContent: {
      flex: 1,
    },
  });
