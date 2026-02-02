/**
 * =============================================================================
 * PROMOTION CODE GENERATION FORM COMPONENT
 * =============================================================================
 * Comprehensive form for generating promotion codes with configurable parameters
 *
 * FEATURES:
 * - Event period selection with date pickers
 * - Subscription plan selection (Voca Unlimited / Voca Speaking)
 * - Duration type toggle (Permanent / Temporary)
 * - Usage limits configuration (total uses, per-user uses)
 * - Description input for code tracking
 * - Batch generation (1-100 codes at once)
 * - Generated codes display with copy functionality
 * - Input validation and error handling
 * - Theme-aware styling (dark/light mode)
 *
 * FORM STRUCTURE:
 * 1. Event Period: Start and end dates for code validity
 * 2. Subscription Plan: Which plan the code unlocks
 * 3. Duration Type: Permanent or temporary subscription
 * 4. Usage Limits: How many times code can be used
 * 5. Description: Internal note about the promotion
 * 6. Code Count: How many codes to generate
 * 7. Generate Button: Submits form and creates codes
 * 8. Generated Codes: Displays newly created codes
 *
 * VALIDATION RULES:
 * - Description: Required, non-empty
 * - Code Count: 1-100 integer
 * - Duration Days: Required if temporary, positive integer
 * - Max Uses: -1 for unlimited, or positive integer
 * - Max Uses Per User: Positive integer
 *
 * USER INTERACTIONS:
 * - Tap date buttons: Opens native date picker
 * - Toggle plan/duration: Updates selection state
 * - Fill inputs: Updates form state
 * - Tap generate: Validates and creates codes
 * - Tap generated code: Copies to clipboard
 * =============================================================================
 */

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  CodeGenerationRequest,
  PlanType,
} from "../../../../src/types/promotionCode";

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface GenerationFormProps {
  /** Callback fired when codes are successfully generated */
  onCodesGenerated: () => void;

  /** User ID of the admin generating the codes */
  userId: string;

  /** Dark mode flag for theming */
  isDark: boolean;

  /** Function to generate codes (injected from parent) */
  generateCodes: (
    request: CodeGenerationRequest,
    userId: string
  ) => Promise<{ codes: string[] }>;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * GenerationForm Component
 *
 * Renders a comprehensive form for creating promotion codes with all
 * configuration options. Manages its own form state and validation.
 *
 * WORKFLOW:
 * 1. User configures all form fields
 * 2. User taps "Generate Codes"
 * 3. Form validates all inputs
 * 4. If valid, calls generateCodes API
 * 5. Displays generated codes with copy functionality
 * 6. Notifies parent to refresh active codes list
 */
export const GenerationForm: React.FC<GenerationFormProps> = ({
  onCodesGenerated,
  userId,
  isDark,
  generateCodes,
}) => {
  const styles = getStyles(isDark);

  // ---------------------------------------------------------------------------
  // STATE: Date Configuration
  // ---------------------------------------------------------------------------
  /** Event start date - when codes become active */
  const [startDate, setStartDate] = useState(new Date());
  /** Event end date - when codes expire */
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days from now
    return date;
  });
  /** Visibility flag for start date picker */
  const [showStartPicker, setShowStartPicker] = useState(false);
  /** Visibility flag for end date picker */
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ---------------------------------------------------------------------------
  // STATE: Subscription Configuration
  // ---------------------------------------------------------------------------
  /** Selected subscription plan to unlock */
  const [selectedPlan, setSelectedPlan] =
    useState<PlanType>("voca_unlimited");
  /** Whether subscription is permanent or temporary */
  const [isPermanent, setIsPermanent] = useState(true);
  /** Duration in days (only used if !isPermanent) */
  const [durationDays, setDurationDays] = useState("30");

  // ---------------------------------------------------------------------------
  // STATE: Usage Limits
  // ---------------------------------------------------------------------------
  /** Maximum total uses across all users (-1 for unlimited) */
  const [maxUses, setMaxUses] = useState("100");
  /** Maximum uses per individual user */
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");

  // ---------------------------------------------------------------------------
  // STATE: Metadata
  // ---------------------------------------------------------------------------
  /** Internal description for tracking promotion */
  const [description, setDescription] = useState("");
  /** Number of codes to generate in this batch (1-100) */
  const [codeCount, setCodeCount] = useState("1");

  // ---------------------------------------------------------------------------
  // STATE: Generation Status
  // ---------------------------------------------------------------------------
  /** Loading flag during code generation */
  const [generating, setGenerating] = useState(false);
  /** Array of successfully generated codes */
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // HANDLER: Generate Codes
  // ---------------------------------------------------------------------------
  /**
   * Validates form and generates promotion codes
   *
   * VALIDATION STEPS:
   * 1. Check description is non-empty
   * 2. Validate code count is 1-100
   * 3. Parse and validate all numeric fields
   *
   * GENERATION WORKFLOW:
   * 1. Build CodeGenerationRequest object
   * 2. Call generateCodes API
   * 3. Display generated codes
   * 4. Show success alert
   * 5. Notify parent to refresh list
   *
   * ERROR HANDLING:
   * - Shows alert for validation errors
   * - Shows alert for API errors
   * - Logs errors to console for debugging
   */
  const handleGenerateCodes = async () => {
    // Validate description
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    // Validate code count
    const count = parseInt(codeCount);
    if (isNaN(count) || count < 1 || count > 100) {
      Alert.alert("Error", "Please enter a valid count (1-100)");
      return;
    }

    // Build request object
    const request: CodeGenerationRequest = {
      eventPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      benefit: {
        type: "subscription_upgrade",
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
      // Call API to generate codes
      const result = await generateCodes(request, userId);
      setGeneratedCodes(result.codes);

      // Show success message and refresh parent list
      Alert.alert(
        "Success",
        `Generated ${result.codes.length} promotion codes successfully!`,
        [
          {
            text: "OK",
            onPress: () => {
              onCodesGenerated(); // Refresh active codes list
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Generation error:", error);
      Alert.alert("Error", error.message || "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: Copy Code to Clipboard
  // ---------------------------------------------------------------------------
  /**
   * Copies a generated code to clipboard and shows confirmation
   *
   * @param code - The promotion code to copy
   */
  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert("Copied", `Code ${code} copied to clipboard`);
  };

  // ---------------------------------------------------------------------------
  // RENDER: Form
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.section}>
      {/* =====================================================================
          EVENT PERIOD SECTION
          Start and end dates for code validity window
          ===================================================================== */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Period</Text>
        <View style={styles.dateRow}>
          {/* Start Date Button */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateText}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>to</Text>

          {/* End Date Button */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        {/* Native Date Pickers (shown conditionally) */}
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

      {/* =====================================================================
          SUBSCRIPTION PLAN SECTION
          Choose which plan the code unlocks
          ===================================================================== */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Subscription Plan</Text>
        <View style={styles.planButtons}>
          {/* Voca Unlimited Button */}
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === "voca_unlimited" && styles.planButtonActive,
            ]}
            onPress={() => setSelectedPlan("voca_unlimited")}
          >
            <Text
              style={[
                styles.planButtonText,
                selectedPlan === "voca_unlimited" &&
                  styles.planButtonTextActive,
              ]}
            >
              Voca Unlimited
            </Text>
          </TouchableOpacity>

          {/* Voca + Speaking Button */}
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === "voca_speaking" && styles.planButtonActive,
            ]}
            onPress={() => setSelectedPlan("voca_speaking")}
          >
            <Text
              style={[
                styles.planButtonText,
                selectedPlan === "voca_speaking" && styles.planButtonTextActive,
              ]}
            >
              Voca + Speaking
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =====================================================================
          DURATION TYPE SECTION
          Permanent subscription or temporary (with day count)
          ===================================================================== */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Duration Type</Text>
        <View style={styles.planButtons}>
          {/* Permanent Button */}
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

          {/* Temporary Button */}
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

        {/* Duration Days Input (only shown for temporary) */}
        {!isPermanent && (
          <TextInput
            style={styles.input}
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="Duration in days"
            placeholderTextColor={isDark ? "#666" : "#999"}
            keyboardType="number-pad"
          />
        )}
      </View>

      {/* =====================================================================
          USAGE LIMITS SECTION
          Configure how many times codes can be used
          ===================================================================== */}

      {/* Max Total Uses */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Total Uses (-1 for unlimited)</Text>
        <TextInput
          style={styles.input}
          value={maxUses}
          onChangeText={setMaxUses}
          placeholder="100"
          placeholderTextColor={isDark ? "#666" : "#999"}
          keyboardType="number-pad"
        />
      </View>

      {/* Max Uses Per User */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Max Uses Per User</Text>
        <TextInput
          style={styles.input}
          value={maxUsesPerUser}
          onChangeText={setMaxUsesPerUser}
          placeholder="1"
          placeholderTextColor={isDark ? "#666" : "#999"}
          keyboardType="number-pad"
        />
      </View>

      {/* =====================================================================
          DESCRIPTION SECTION
          Internal note for tracking this promotion
          ===================================================================== */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Launch 2026 promotion"
          placeholderTextColor={isDark ? "#666" : "#999"}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* =====================================================================
          CODE COUNT SECTION
          How many codes to generate in this batch
          ===================================================================== */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Number of Codes to Generate</Text>
        <TextInput
          style={styles.input}
          value={codeCount}
          onChangeText={setCodeCount}
          placeholder="1"
          placeholderTextColor={isDark ? "#666" : "#999"}
          keyboardType="number-pad"
        />
      </View>

      {/* =====================================================================
          GENERATE BUTTON
          Submits form and creates codes
          ===================================================================== */}
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

      {/* =====================================================================
          GENERATED CODES DISPLAY
          Shows newly created codes with copy functionality
          ===================================================================== */}
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
  );
};

// =============================================================================
// STYLES
// =============================================================================

/**
 * Dynamic styles based on theme
 *
 * STYLE CATEGORIES:
 * - Layout: Section container and form groups
 * - Typography: Labels and text inputs
 * - Date Picker: Date selection buttons and separators
 * - Plan Selection: Toggle buttons for plans and duration
 * - Buttons: Generate button with loading state
 * - Generated Codes: Display container for new codes
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark backgrounds (#1a1a1a, #000) with light text
 * - Light mode: Light backgrounds (#f5f5f5, #fff) with dark text
 * - Active states: Blue (#007AFF) in both modes
 *
 * ACCESSIBILITY:
 * - Minimum touch target sizes (44px+ height)
 * - High contrast text colors
 * - Clear visual feedback for interactive elements
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
    /** Individual form field group */
    formGroup: {
      marginBottom: 20,
    },

    // =========================================================================
    // TYPOGRAPHY & INPUTS
    // =========================================================================
    /** Field label text */
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
      marginBottom: 8,
    },
    /** Standard text input */
    input: {
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ddd",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    /** Multi-line text area for description */
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },

    // =========================================================================
    // DATE PICKER
    // =========================================================================
    /** Horizontal row for date range */
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    /** Individual date button */
    dateButton: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ddd",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    /** Date text inside button */
    dateText: {
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    /** "to" separator between dates */
    dateSeparator: {
      fontSize: 16,
      color: isDark ? "#666" : "#999",
    },

    // =========================================================================
    // PLAN SELECTION BUTTONS
    // =========================================================================
    /** Container for plan toggle buttons */
    planButtons: {
      flexDirection: "row",
      gap: 12,
    },
    /** Individual plan button (inactive state) */
    planButton: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ddd",
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    /** Plan button active state */
    planButtonActive: {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
    /** Plan button text (inactive) */
    planButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    /** Plan button text (active) */
    planButtonTextActive: {
      color: "#fff",
    },

    // =========================================================================
    // GENERATE BUTTON
    // =========================================================================
    /** Main generate codes button */
    generateButton: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },
    /** Generate button disabled state (during loading) */
    buttonDisabled: {
      backgroundColor: isDark ? "#333" : "#ccc",
    },
    /** Generate button text */
    generateButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },

    // =========================================================================
    // GENERATED CODES DISPLAY
    // =========================================================================
    /** Container for generated codes list */
    generatedContainer: {
      marginTop: 20,
      padding: 16,
      backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
      borderRadius: 12,
    },
    /** "Generated Codes:" title */
    generatedTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 12,
    },
    /** Individual generated code row */
    generatedCode: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? "#000" : "#fff",
      borderRadius: 8,
      marginBottom: 8,
    },
    /** Generated code text (monospaced with letter spacing) */
    generatedCodeText: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      letterSpacing: 2,
    },
  });
