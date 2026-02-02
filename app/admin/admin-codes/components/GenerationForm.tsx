/**
 * =============================================================================
 * ADMIN CODE GENERATION FORM COMPONENT
 * =============================================================================
 * Form for generating new admin registration codes
 *
 * FEATURES:
 * - Three configurable parameters:
 *   1. Max Uses: How many times the code can be used (default: 1)
 *   2. Expires In Days: Optional expiration period
 *   3. Description: Internal note about the code's purpose
 * - Form validation before submission
 * - Loading state during generation
 * - Automatic form reset after successful generation
 * - Theme-aware styling (dark/light mode)
 * - Internationalization support
 *
 * VALIDATION:
 * - Max Uses must be a positive integer
 * - Expires In Days must be a positive integer (if provided)
 * - Description is optional
 *
 * WORKFLOW:
 * 1. User fills out form fields
 * 2. User taps "Generate Code" button
 * 3. Form validates input
 * 4. Calls createAdminCode API
 * 5. Shows success alert with generated code
 * 6. Resets form
 * 7. Calls onCodeGenerated callback to refresh list
 * =============================================================================
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TFunction } from "react-i18next";
import { createAdminCode } from "../../../../src/services/adminCodeService";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface GenerationFormProps {
  /** Dark mode flag for theming */
  isDark: boolean;

  /** Callback invoked after code is successfully generated */
  onCodeGenerated: () => void;

  /** Translation function from react-i18next */
  t: TFunction;

  /** Current user ID for code creation tracking */
  userId: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * GenerationForm Component
 *
 * Renders a form for creating new admin registration codes with
 * configurable parameters and validation.
 *
 * FORM FIELDS:
 * - Max Uses: Number input (default: "1")
 * - Expires In Days: Number input (optional)
 * - Description: Text input (optional, multiline)
 *
 * BUTTON STATES:
 * - Normal: Blue background with "Generate Code" text
 * - Generating: Disabled with loading spinner
 */
export const GenerationForm: React.FC<GenerationFormProps> = ({
  isDark,
  onCodeGenerated,
  t,
  userId,
}) => {
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // STATE: Form Fields
  // ---------------------------------------------------------------------------
  /** Maximum number of times the code can be used */
  const [maxUses, setMaxUses] = useState("1");
  /** Number of days until code expires (empty = no expiration) */
  const [expiresInDays, setExpiresInDays] = useState("");
  /** Internal description/note about the code */
  const [description, setDescription] = useState("");

  // ---------------------------------------------------------------------------
  // STATE: Generation Status
  // ---------------------------------------------------------------------------
  /** Loading flag during code generation */
  const [generating, setGenerating] = useState(false);

  // ---------------------------------------------------------------------------
  // HANDLER: Generate Code
  // ---------------------------------------------------------------------------
  /**
   * Validates form and generates admin registration code
   *
   * VALIDATION STEPS:
   * 1. Parse and validate maxUses (must be positive integer)
   * 2. Parse and validate expiresInDays if provided (must be positive integer)
   * 3. Build options object with parsed values
   *
   * SUCCESS FLOW:
   * 1. Call createAdminCode API
   * 2. Show alert with generated code
   * 3. Reset form fields
   * 4. Call onCodeGenerated callback
   *
   * ERROR FLOW:
   * 1. Catch error
   * 2. Show error alert
   * 3. Log error to console
   *
   * @async
   */
  const handleGenerateCode = async () => {
    try {
      setGenerating(true);

      // Parse and validate maxUses
      const parsedMaxUses = parseInt(maxUses);
      if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
        Alert.alert(t("common.error"), "Max uses must be at least 1");
        return;
      }

      // Build options object
      const options = {
        maxUses: parsedMaxUses,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        description: description || undefined,
      };

      // Validate expiresInDays if provided
      if (options.expiresInDays !== undefined && (isNaN(options.expiresInDays) || options.expiresInDays < 1)) {
        Alert.alert(t("common.error"), "Expiration days must be at least 1");
        return;
      }

      // Generate code
      const newCode = await createAdminCode(userId, options);

      // Show success alert with code
      Alert.alert(
        t("adminCodes.generate.success"),
        `Code: ${newCode.code}\n\nCopy this code to share with new administrators.`,
      );

      // Reset form
      setMaxUses("1");
      setExpiresInDays("");
      setDescription("");

      // Notify parent to reload codes list
      onCodeGenerated();
    } catch (error) {
      console.error("Error generating admin code:", error);
      Alert.alert(t("common.error"), t("adminCodes.generate.error"));
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER: Form
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        {/* =====================================================================
            MAX USES INPUT
            Number of times the code can be used
            ===================================================================== */}
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

        {/* =====================================================================
            EXPIRES IN DAYS INPUT
            Optional expiration period in days
            ===================================================================== */}
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

        {/* =====================================================================
            DESCRIPTION INPUT
            Optional internal note about the code
            ===================================================================== */}
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

        {/* =====================================================================
            GENERATE BUTTON
            Submits form and creates new admin code
            ===================================================================== */}
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
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE CATEGORIES:
 * - Layout: Section and card containers
 * - Form Inputs: Text inputs with labels
 * - Buttons: Generate button with states
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark cards (#1c1c1e) with light text
 * - Light mode: Light cards (#fff) with dark text
 * - Button: Blue (#007AFF) in both modes
 *
 * ACCESSIBILITY:
 * - Minimum touch target sizes (44px+ height)
 * - High contrast text colors
 * - Clear visual feedback for disabled state
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
    /** Card container for form */
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

    // =========================================================================
    // FORM INPUTS
    // =========================================================================
    /** Input group container */
    inputGroup: {
      marginBottom: 16,
    },
    /** Input label text */
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 8,
    },
    /** Text input field */
    input: {
      backgroundColor: isDark ? "#2c2c2e" : "#f9f9f9",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },

    // =========================================================================
    // BUTTONS
    // =========================================================================
    /** Generate button */
    generateButton: {
      backgroundColor: "#007AFF",
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 8,
    },
    /** Disabled button state */
    buttonDisabled: {
      opacity: 0.6,
    },
    /** Generate button text */
    generateButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
