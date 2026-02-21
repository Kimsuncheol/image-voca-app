/**
 * =============================================================================
 * ADVERTISEMENTS ADMINISTRATION SCREEN
 * =============================================================================
 * Main admin screen for managing advertisements displayed in the advertisement modal
 *
 * FEATURES:
 * - Admin-only access control with permission check
 * - Two main sections:
 *   1. Add Advertisement: Create new ads (image upload or video URL)
 *   2. Manage Ads: View and manage existing advertisements
 * - Advertisement creation with:
 *   - Type selection (image or video)
 *   - Image upload via expo-image-picker
 *   - Video URL input
 *   - Title and description fields
 * - Advertisement management:
 *   - View all ads (active and inactive)
 *   - Toggle active/inactive status
 *   - Delete advertisements
 *   - Refresh ads list
 * - Theme-aware UI (dark/light mode)
 *
 * COMPONENTS USED:
 * - AdForm: Form for creating advertisements
 * - AdList: List view with ad management actions
 * - AdCard: Individual ad display card
 *
 * DATA SOURCES:
 * - Firestore ads collection: All advertisements
 * - Firebase Storage: Ad image files
 * - advertisementService: API for ad CRUD operations
 *
 * PERMISSIONS:
 * - Only users with role='admin' can access this screen
 * - Non-admin users see access denied message
 *
 * WORKFLOW:
 * 1. Check user authentication and admin status
 * 2. Admin can create new ads via form
 * 3. Admin can view and manage existing ads
 * 4. Changes are saved to Firestore and Storage
 * 5. UI updates reflect changes immediately
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  deleteAdvertisement,
  getAllAdvertisements,
  toggleAdStatus,
} from "../../src/services/advertisementService";
import { db } from "../../src/services/firebase";
import type { Advertisement } from "../../src/types/advertisement";

// Import advertisement components
import { AdForm, AdList } from "./advertisements/components";

type TabType = "add" | "manage";

export default function AdvertisementsAdmin() {
  // ---------------------------------------------------------------------------
  // HOOKS & CONTEXT
  // ---------------------------------------------------------------------------
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // STATE: Authentication & Authorization
  // ---------------------------------------------------------------------------
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // ---------------------------------------------------------------------------
  // STATE: Tab Navigation
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabType>("add");

  // ---------------------------------------------------------------------------
  // STATE: Advertisements List
  // ---------------------------------------------------------------------------
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // EFFECT: Check Admin Permissions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.uid) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role.includes("admin")) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("[Ads Admin] Error checking admin status:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // ---------------------------------------------------------------------------
  // EFFECT: Load Ads When Manage Tab is Active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isAdmin && activeTab === "manage") {
      loadAds();
    }
  }, [isAdmin, activeTab]);

  // ---------------------------------------------------------------------------
  // HANDLER: Load Advertisements
  // ---------------------------------------------------------------------------
  const loadAds = async () => {
    setLoading(true);
    try {
      const fetchedAds = await getAllAdvertisements();
      setAds(fetchedAds);
    } catch (error: any) {
      console.error("[Ads Admin] Error loading ads:", error);
      Alert.alert("Error", error.message || "Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Ad Created Callback
  // ---------------------------------------------------------------------------
  const handleAdCreated = () => {
    // Switch to manage tab and reload ads
    setActiveTab("manage");
    loadAds();
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Delete Ad
  // ---------------------------------------------------------------------------
  const handleDeleteAd = async (adId: string) => {
    Alert.alert(
      "Delete Advertisement",
      "Are you sure you want to delete this advertisement? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdvertisement(adId);
              Alert.alert("Success", "Advertisement deleted successfully");
              loadAds(); // Refresh list
            } catch (error: any) {
              console.error("[Ads Admin] Error deleting ad:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete advertisement",
              );
            }
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Toggle Ad Status
  // ---------------------------------------------------------------------------
  const handleToggleStatus = async (adId: string, active: boolean) => {
    try {
      await toggleAdStatus(adId, active);
      loadAds(); // Refresh list
    } catch (error: any) {
      console.error("[Ads Admin] Error toggling status:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update advertisement status",
      );
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER: Loading State (Checking Permissions)
  // ---------------------------------------------------------------------------
  if (checkingAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: Access Denied State (Non-Admin Users)
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Access Denied",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.centered}>
          <Ionicons
            name="lock-closed"
            size={64}
            color={isDark ? "#666" : "#ccc"}
          />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You don&apos;t have permission to access this page.
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

  // ---------------------------------------------------------------------------
  // RENDER: Main Admin Dashboard (Authorized Users)
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Navigation Header */}
      <Stack.Screen
        options={{
          title: "Advertisements Admin",
          headerBackTitle: "Back",
        }}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "add" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("add")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "add" && styles.tabButtonTextActive,
            ]}
          >
            Add Advertisement
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "manage" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("manage")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "manage" && styles.tabButtonTextActive,
            ]}
          >
            Manage Ads
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "add" ? (
          <AdForm
            onAdCreated={handleAdCreated}
            userId={user!.uid}
            isDark={isDark}
          />
        ) : (
          <AdList
            ads={ads}
            loading={loading}
            onRefresh={loadAds}
            onDelete={handleDeleteAd}
            onToggleStatus={handleToggleStatus}
            isDark={isDark}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#aaa" : "#666",
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? "#aaa" : "#666",
      textAlign: "center",
      marginBottom: 24,
    },
    backButton: {
      backgroundColor: "#007AFF",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
    backButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    tabContainer: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 10,
      backgroundColor: isDark ? "#1c1c1e" : "#e5e5ea",
      padding: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 8,
    },
    tabButtonActive: {
      backgroundColor: "#007AFF",
    },
    tabButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
    tabButtonTextActive: {
      color: "#fff",
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
}
