/**
 * =============================================================================
 * ACTIVE CODES LIST COMPONENT
 * =============================================================================
 * Displays list of all active and inactive promotion codes with management
 *
 * FEATURES:
 * - Refresh button to reload codes from Firestore
 * - Loading state with spinner
 * - Empty state message when no codes exist
 * - Individual code cards with:
 *   - Code text (tap to copy)
 *   - Status badge (active/inactive)
 *   - Description
 *   - Details: Plan, uses, expiration date
 *   - Deactivate button (for active codes only)
 * - Theme-aware styling (dark/light mode)
 * - Clipboard integration for easy code sharing
 *
 * CODE CARD LAYOUT:
 * - Header: Code + Status badge
 * - Description line
 * - Details row: Plan, uses, expiration
 * - Deactivate button (conditional)
 *
 * STATUS COLORS:
 * - Active: Green (#28a745)
 * - Inactive: Gray (#6c757d)
 *
 * USER INTERACTIONS:
 * - Tap code: Copies to clipboard
 * - Tap refresh: Reloads codes from database
 * - Tap deactivate: Shows confirmation, then deactivates code
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { PromotionCode } from "../../../../src/types/promotionCode";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface ActiveCodesListProps {
  /** Array of all promotion codes (active and inactive) */
  codes: PromotionCode[];

  /** Loading state flag */
  loading: boolean;

  /** Callback to refresh codes from Firestore */
  onRefresh: () => void;

  /** Callback to deactivate a code */
  onDeactivateCode: (code: string) => void;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ActiveCodesList Component
 *
 * Renders a list of all promotion codes with management actions.
 * Codes are displayed in descending order by creation date (newest first).
 *
 * WORKFLOW:
 * 1. Parent loads codes on mount
 * 2. Component displays codes or loading/empty state
 * 3. User can refresh list with button
 * 4. User can tap code to copy
 * 5. User can deactivate active codes
 * 6. Parent handles all data mutations
 */
export const ActiveCodesList: React.FC<ActiveCodesListProps> = ({
  codes,
  loading,
  onRefresh,
  onDeactivateCode,
  isDark,
}) => {
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // HANDLER: Copy Code to Clipboard
  // ---------------------------------------------------------------------------
  /**
   * Copies a promotion code to clipboard and shows confirmation
   *
   * @param code - The promotion code to copy
   */
  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Copied", `Code ${code} copied to clipboard`);
  };

  // ---------------------------------------------------------------------------
  // RENDER: Active Codes List
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.section}>
      {/* =====================================================================
          SECTION HEADER
          Title with refresh button
          ===================================================================== */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Codes</Text>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Ionicons
            name="refresh"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* =====================================================================
          CONTENT AREA
          Shows loading, empty, or code list based on state
          ===================================================================== */}

      {/* Loading State */}
      {loading ? (
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
      ) : codes.length === 0 ? (
        /* Empty State */
        <Text style={styles.emptyText}>No promotion codes yet</Text>
      ) : (
        /* Code Cards List */
        codes.map((code) => (
          <View key={code.code} style={styles.codeCard}>
            {/* ===============================================================
                CODE HEADER
                Code text (tappable) + status badge
                =============================================================== */}
            <View style={styles.codeHeader}>
              {/* Code Text - Tap to copy */}
              <TouchableOpacity onPress={() => copyCode(code.code)}>
                <Text style={styles.codeText}>{code.code}</Text>
              </TouchableOpacity>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  code.status === "active"
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>{code.status}</Text>
              </View>
            </View>

            {/* ===============================================================
                DESCRIPTION
                Internal note about this promotion
                =============================================================== */}
            <Text style={styles.codeDescription}>{code.description}</Text>

            {/* ===============================================================
                CODE DETAILS
                Plan, usage stats, and expiration date
                =============================================================== */}
            <View style={styles.codeDetails}>
              {/* Plan Type */}
              <Text style={styles.detailText}>
                Plan: {code.benefit.planId.replace("_", " ")}
              </Text>

              {/* Usage Statistics */}
              <Text style={styles.detailText}>
                Uses: {code.currentUses}/
                {code.maxUses === -1 ? "∞" : code.maxUses}
              </Text>

              {/* Expiration Date */}
              <Text style={styles.detailText}>
                Expires:{" "}
                {new Date(code.eventPeriod.endDate).toLocaleDateString()}
              </Text>
            </View>

            {/* ===============================================================
                DEACTIVATE BUTTON
                Only shown for active codes
                =============================================================== */}
            {code.status === "active" && (
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => onDeactivateCode(code.code)}
              >
                <Text style={styles.deactivateButtonText}>Deactivate</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE CATEGORIES:
 * - Layout: Section container and headers
 * - Code Cards: Individual code display containers
 * - Status Badges: Active/inactive status indicators
 * - Details: Plan, usage, and date information
 * - Buttons: Deactivate action button
 * - Empty State: No codes message
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark cards (#1a1a1a) with light text
 * - Light mode: Light cards (#f5f5f5) with dark text
 * - Status colors: Green for active, gray for inactive (same in both modes)
 *
 * ACCESSIBILITY:
 * - High contrast text colors
 * - Clear visual hierarchy with font sizes and weights
 * - Minimum touch target sizes for buttons
 * - Letter spacing for code readability
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // =========================================================================
    // LAYOUT & CONTAINERS
    // =========================================================================
    /** Main section container */
    section: {
      marginBottom: 32,
    },
    /** Section header with title and refresh button */
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    /** Section title text */
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },

    // =========================================================================
    // CODE CARDS
    // =========================================================================
    /** Individual code card container */
    codeCard: {
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    /** Code header row with code text and status */
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    /** Promotion code text (large, monospaced) */
    codeText: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      letterSpacing: 2,
    },

    // =========================================================================
    // STATUS BADGES
    // =========================================================================
    /** Status badge container */
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    /** Active status badge (green) */
    statusActive: {
      backgroundColor: "#28a745",
    },
    /** Inactive status badge (gray) */
    statusInactive: {
      backgroundColor: "#6c757d",
    },
    /** Status text (uppercase) */
    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },

    // =========================================================================
    // DESCRIPTION & DETAILS
    // =========================================================================
    /** Code description text */
    codeDescription: {
      fontSize: 14,
      color: isDark ? "#ccc" : "#666",
      marginBottom: 12,
    },
    /** Details container (plan, uses, expiration) */
    codeDetails: {
      gap: 6,
      marginBottom: 12,
    },
    /** Individual detail text line */
    detailText: {
      fontSize: 13,
      color: isDark ? "#999" : "#666",
    },

    // =========================================================================
    // DEACTIVATE BUTTON
    // =========================================================================
    /** Deactivate button (red) */
    deactivateButton: {
      backgroundColor: "#dc3545",
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
    },
    /** Deactivate button text */
    deactivateButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },

    // =========================================================================
    // EMPTY STATE
    // =========================================================================
    /** Empty state message when no codes exist */
    emptyText: {
      fontSize: 16,
      color: isDark ? "#666" : "#999",
      textAlign: "center",
      paddingVertical: 40,
    },
  });
