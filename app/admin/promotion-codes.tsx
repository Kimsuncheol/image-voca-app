/**
 * =============================================================================
 * PROMOTION CODES ADMINISTRATION DASHBOARD
 * =============================================================================
 * Main admin screen for generating and managing promotion codes
 *
 * FEATURES:
 * - Admin-only access control with permission check
 * - Two main sections:
 *   1. Generation Form: Create new promotion codes with configuration
 *   2. Active Codes List: View and manage existing codes
 * - Code generation with customizable parameters:
 *   - Event period (start/end dates)
 *   - Subscription plan (Unlimited/Speaking)
 *   - Duration type (Permanent/Temporary)
 *   - Usage limits (total uses, per-user uses)
 *   - Batch generation (1-100 codes at once)
 * - Code management:
 *   - View all codes sorted by creation date
 *   - Copy codes to clipboard
 *   - Deactivate active codes
 *   - Refresh codes list
 * - Theme-aware UI (dark/light mode)
 *
 * COMPONENTS USED:
 * - GenerationForm: Comprehensive form for creating codes
 * - ActiveCodesList: List view with code management actions
 *
 * DATA SOURCES:
 * - Firestore promotionCodes collection: All promotion codes
 * - promotionCodeService: API for code generation and management
 *
 * PERMISSIONS:
 * - Only users with role='admin' can access this screen
 * - Non-admin users see access denied message
 * - Unauthenticated users are redirected
 *
 * WORKFLOW:
 * 1. Check user authentication and admin status
 * 2. Load all promotion codes from Firestore
 * 3. Admin can generate new codes via form
 * 4. Admin can view and manage existing codes
 * 5. Changes are saved to Firestore
 * 6. UI updates reflect changes immediately
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
import { db } from "../../src/services/firebase";
import {
  deactivateCode,
  generatePromotionCodes,
  getAllPromotionCodes,
} from "../../src/services/promotionCodeService";
import type { PromotionCode } from "../../src/types/promotionCode";

// Import extracted components
import { ActiveCodesList, GenerationForm } from "./promotion-codes/components";

// =============================================================================
// COMPONENT: PromotionCodesAdmin
// =============================================================================

export default function PromotionCodesAdmin() {
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
  /** Admin status flag (true if user has role='admin') */
  const [isAdmin, setIsAdmin] = useState(false);
  /** Loading state for admin permission check */
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // ---------------------------------------------------------------------------
  // STATE: Codes List
  // ---------------------------------------------------------------------------
  /** Complete list of all promotion codes from Firestore */
  const [codes, setCodes] = useState<PromotionCode[]>([]);
  /** Loading state for codes fetch operation */
  const [loadingCodes, setLoadingCodes] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE: Tab Navigation
  // ---------------------------------------------------------------------------
  /** Active tab: 'generate' or 'active' */
  const [activeTab, setActiveTab] = useState<"generate" | "active">("generate");

  // ---------------------------------------------------------------------------
  // EFFECT: Admin Permission Check
  // ---------------------------------------------------------------------------
  /**
   * Check if current user has admin role
   *
   * WORKFLOW:
   * 1. Verify user is authenticated
   * 2. Fetch user document from Firestore
   * 3. Check if role field equals 'admin'
   * 4. Update isAdmin state accordingly
   * 5. Set checkingAdmin to false when complete
   *
   * DEPENDENCIES:
   * - user: Re-runs when authentication state changes
   */
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role.includes("admin")) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Admin check error:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // ---------------------------------------------------------------------------
  // EFFECT: Load Codes on Mount
  // ---------------------------------------------------------------------------
  /**
   * Load all promotion codes when admin access is confirmed
   *
   * DEPENDENCIES:
   * - isAdmin: Only runs when user is confirmed as admin
   */
  useEffect(() => {
    if (isAdmin) {
      loadCodes();
    }
  }, [isAdmin]);

  // ---------------------------------------------------------------------------
  // HANDLER: Load Promotion Codes
  // ---------------------------------------------------------------------------
  /**
   * Fetches all promotion codes from Firestore via promotionCodeService
   * Sorts codes by creation date (newest first)
   *
   * DATA INCLUDES:
   * - Code: The promotion code string
   * - Status: active or inactive
   * - Benefit: Plan type and duration
   * - Event period: Start and end dates
   * - Usage: Current uses and limits
   * - Description: Internal note
   * - Created by: Admin user ID
   */
  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const allCodes = await getAllPromotionCodes();
      // Sort by creation date (newest first)
      setCodes(
        allCodes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Load codes error:", error);
      Alert.alert("Error", "Failed to load promotion codes");
    } finally {
      setLoadingCodes(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Deactivate Code
  // ---------------------------------------------------------------------------
  /**
   * Deactivates a promotion code after confirmation
   *
   * WORKFLOW:
   * 1. Show confirmation alert
   * 2. If confirmed, call deactivateCode API
   * 3. Show success alert
   * 4. Reload codes list to reflect change
   *
   * SIDE EFFECTS:
   * - Updates Firestore promotionCodes/{code}/status field
   * - Refreshes local codes list
   *
   * @param code - The promotion code to deactivate
   */
  const handleDeactivateCode = async (code: string) => {
    Alert.alert(
      "Deactivate Code",
      `Are you sure you want to deactivate ${code}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateCode(code);
              Alert.alert("Success", "Code deactivated");
              loadCodes(); // Refresh list
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to deactivate code",
              );
            }
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER: Loading State (Checking Permissions)
  // ---------------------------------------------------------------------------
  /**
   * Displayed while verifying admin permissions
   * Shows spinner and loading message
   */
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
  /**
   * Displayed when user is authenticated but not an admin
   * Shows lock icon, error message, and back button
   */
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
  /**
   * Main dashboard view for admin users
   *
   * LAYOUT STRUCTURE:
   * 1. Header with navigation
   * 2. Tab navigation (Generate / Active Codes)
   * 3. Tab content - conditionally renders based on active tab
   *
   * TAB VIEWS:
   * - Generate Tab: GenerationForm component
   * - Active Codes Tab: ActiveCodesList component
   */
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Navigation Header */}
      <Stack.Screen
        options={{
          title: "Promotion Codes Admin",
          headerBackTitle: "Back",
        }}
      />

      {/* =================================================================
          TAB NAVIGATION
          Two tabs: Generate Promotion Codes and Active Codes
          ================================================================= */}
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
            Generate Promotion Codes
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
            Active Codes
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================================
          TAB CONTENT
          Conditionally renders based on selected tab
          ================================================================= */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "generate" ? (
          /* =================================================================
              GENERATION FORM TAB
              Form for creating new promotion codes with all configuration
              ================================================================= */
          <GenerationForm
            onCodesGenerated={loadCodes}
            userId={user!.uid}
            isDark={isDark}
            generateCodes={generatePromotionCodes}
          />
        ) : (
          /* =================================================================
              ACTIVE CODES LIST TAB
              Display and management of existing promotion codes
              ================================================================= */
          <ActiveCodesList
            codes={codes}
            loading={loadingCodes}
            onRefresh={loadCodes}
            onDeactivateCode={handleDeactivateCode}
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
/**
 * Styles for main container and states
 * Component-specific styles have been moved to their respective component files
 *
 * REMAINING STYLES:
 * - Container: Main app container and centered layout
 * - Tab Navigation: Tab buttons and active states
 * - Loading State: Permission check loading screen
 * - Access Denied State: Non-admin error screen
 * - Scroll Content: Padding and spacing for scroll view
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
      backgroundColor: isDark ? "#000" : "#fff",
    },
    /** Centered layout - for loading and error states */
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    /** Scroll view content container with padding */
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================
    /** Tab navigation container */
    tabContainer: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
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

    // =========================================================================
    // LOADING STATE (Permission Check)
    // =========================================================================
    /** Loading text below spinner during permission check */
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#666" : "#999",
    },

    // =========================================================================
    // ACCESS DENIED STATE (Non-Admin Users)
    // =========================================================================
    /** Error title for access denied screen */
    errorTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    /** Error description text */
    errorText: {
      fontSize: 16,
      color: isDark ? "#666" : "#999",
      textAlign: "center",
      marginBottom: 24,
    },
    /** Back button for returning from access denied screen */
    backButton: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    /** Back button text */
    backButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
