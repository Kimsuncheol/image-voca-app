/**
 * =============================================================================
 * ACTIVE ADMIN CODES LIST COMPONENT
 * =============================================================================
 * Displays list of all active and expired admin registration codes
 *
 * FEATURES:
 * - Loading state with spinner
 * - Empty state with icon and message
 * - Individual code cards with:
 *   - Code text
 *   - Status badge (active/expired)
 *   - Description (if provided)
 *   - Details: Uses, expiration date, creation date
 *   - Actions: Copy button, Deactivate button (if not expired)
 * - Theme-aware styling (dark/light mode)
 * - Internationalization support
 * - FlatList for efficient rendering
 *
 * CODE CARD LAYOUT:
 * - Header: Code + Status badge
 * - Description line (if exists)
 * - Details rows: Uses, expiration, creation date
 * - Action buttons: Copy, Deactivate
 *
 * STATUS COLORS:
 * - Active: Green background with green text
 * - Expired: Red background with red text
 *
 * USER INTERACTIONS:
 * - Tap copy: Copies code to clipboard
 * - Tap deactivate: Shows confirmation, then deactivates code
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TFunction } from "react-i18next";
import { AdminCode } from "../../../../src/types/adminCode";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface ActiveCodesListProps {
  /** Array of all admin codes (active and expired) */
  codes: AdminCode[];

  /** Loading state flag */
  loading: boolean;

  /** Dark mode flag for theming */
  isDark: boolean;

  /** Callback to copy code to clipboard */
  onCopyCode: (code: string) => void;

  /** Callback to deactivate a code */
  onDeactivateCode: (code: string) => void;

  /** Translation function from react-i18next */
  t: TFunction;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ActiveCodesList Component
 *
 * Renders a list of all admin registration codes with management actions.
 * Codes are displayed with their status, usage stats, and action buttons.
 *
 * WORKFLOW:
 * 1. Parent loads codes on mount
 * 2. Component displays codes or loading/empty state
 * 3. User can tap code to copy
 * 4. User can deactivate non-expired codes
 * 5. Parent handles all data mutations
 */
export const ActiveCodesList: React.FC<ActiveCodesListProps> = ({
  codes,
  loading,
  isDark,
  onCopyCode,
  onDeactivateCode,
  t,
}) => {
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // HELPER: Format Date
  // ---------------------------------------------------------------------------
  /**
   * Formats an ISO date string to localized date format
   * Returns "Never" if date is undefined
   *
   * @param dateString - ISO date string or undefined
   * @returns Formatted date string or "Never"
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return t("adminCodes.list.never");
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // ---------------------------------------------------------------------------
  // RENDER: Code Card Item
  // ---------------------------------------------------------------------------
  /**
   * Renders an individual admin code card
   *
   * CARD SECTIONS:
   * 1. Header: Code text + Status badge
   * 2. Description: Optional internal note
   * 3. Details: Uses, expiration, creation date
   * 4. Actions: Copy and deactivate buttons
   *
   * @param item - Admin code object
   */
  const renderCodeItem = ({ item }: { item: AdminCode }) => {
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();

    return (
      <View style={styles.codeCard}>
        {/* =====================================================================
            CODE HEADER
            Code text + status badge
            ===================================================================== */}
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

        {/* =====================================================================
            DESCRIPTION
            Optional internal note
            ===================================================================== */}
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* =====================================================================
            CODE DETAILS
            Usage stats and dates
            ===================================================================== */}
        <View style={styles.codeDetails}>
          {/* Uses */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("adminCodes.list.uses")}:</Text>
            <Text style={styles.detailValue}>
              {item.currentUses} /{" "}
              {item.maxUses === -1
                ? t("adminCodes.list.unlimited")
                : item.maxUses}
            </Text>
          </View>

          {/* Expiration Date */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("adminCodes.list.expires")}:
            </Text>
            <Text style={styles.detailValue}>{formatDate(item.expiresAt)}</Text>
          </View>

          {/* Creation Date */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t("adminCodes.list.created")}:
            </Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* =====================================================================
            ACTION BUTTONS
            Copy and deactivate buttons
            ===================================================================== */}
        <View style={styles.codeActions}>
          {/* Copy Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onCopyCode(item.code)}
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

          {/* Deactivate Button (only for non-expired codes) */}
          {!isExpired && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deactivateButton]}
              onPress={() => onDeactivateCode(item.code)}
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

  // ---------------------------------------------------------------------------
  // RENDER: Active Codes List
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.section}>
      {/* =====================================================================
          LOADING STATE
          Shows spinner while codes are being loaded
          ===================================================================== */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : codes.length === 0 ? (
        /* =====================================================================
            EMPTY STATE
            Shows when no codes exist
            ===================================================================== */
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
        /* =====================================================================
            CODE CARDS LIST
            FlatList of all admin codes
            ===================================================================== */
        <FlatList
          data={codes}
          renderItem={renderCodeItem}
          keyExtractor={(item) => item.code}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
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
 * - Layout: Section containers and list layout
 * - Code Cards: Individual code display containers
 * - Status Badges: Active/expired status indicators
 * - Details: Usage stats and date information
 * - Buttons: Copy and deactivate action buttons
 * - Empty State: No codes message and icon
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark cards (#1c1c1e) with light text
 * - Light mode: Light cards (#fff) with dark text
 * - Status colors: Green for active, red for expired
 *
 * ACCESSIBILITY:
 * - High contrast text colors
 * - Clear visual hierarchy with font sizes and weights
 * - Minimum touch target sizes for buttons
 * - Monospace font for code readability
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    // =========================================================================
    // LAYOUT & CONTAINERS
    // =========================================================================
    /** Main section container */
    section: {
      padding: 16,
    },
    /** Loading container */
    loadingContainer: {
      padding: 40,
      alignItems: "center",
    },
    /** Empty state container */
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    /** FlatList content container */
    listContainer: {
      gap: 12,
    },

    // =========================================================================
    // CODE CARDS
    // =========================================================================
    /** Individual code card container */
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
    /** Code header row with code text and status */
    codeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    /** Admin code text (monospace) */
    codeText: {
      fontSize: 16,
      fontWeight: "bold",
      fontFamily: "monospace",
      color: isDark ? "#fff" : "#000",
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
      backgroundColor: isDark ? "#0F2410" : "#F0FFF4",
    },
    /** Expired status badge (red) */
    statusExpired: {
      backgroundColor: isDark ? "#2C1618" : "#FEE",
    },
    /** Status text */
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#4ADE80" : "#28A745",
    },

    // =========================================================================
    // DESCRIPTION & DETAILS
    // =========================================================================
    /** Code description text */
    description: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      marginBottom: 12,
      fontStyle: "italic",
    },
    /** Details container */
    codeDetails: {
      gap: 8,
      marginBottom: 16,
    },
    /** Individual detail row */
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    /** Detail label text */
    detailLabel: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
    },
    /** Detail value text */
    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },

    // =========================================================================
    // ACTION BUTTONS
    // =========================================================================
    /** Action buttons container */
    codeActions: {
      flexDirection: "row",
      gap: 12,
    },
    /** Individual action button */
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
    /** Action button text */
    actionButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    /** Deactivate button (red) */
    deactivateButton: {
      backgroundColor: isDark ? "#2C1618" : "#FEE",
      borderColor: isDark ? "#5C2B2E" : "#FCC",
    },
    /** Deactivate button text */
    deactivateButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FF3B30",
    },

    // =========================================================================
    // EMPTY STATE
    // =========================================================================
    /** Empty state title */
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginTop: 16,
    },
    /** Empty state message */
    emptyMessage: {
      fontSize: 14,
      color: isDark ? "#888" : "#999",
      marginTop: 8,
      textAlign: "center",
    },
  });
