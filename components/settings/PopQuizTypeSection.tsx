/**
 * ====================================
 * POP QUIZ TYPE SECTION COMPONENT
 * ====================================
 *
 * This component displays a settings section that allows users to select their preferred
 * pop quiz type. When tapped, it opens a modal (PopQuizTypeModal) showing all available
 * quiz types with descriptions.
 *
 * The component displays the current selection and provides a visual cue (chevron) that
 * tapping will open more options.
 */

// ============================================================================
// IMPORTS
// ============================================================================
import { Ionicons } from "@expo/vector-icons"; // Icon library
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text"; // Theme-aware text component
import { PopQuizType, PopQuizTypeModal } from "./PopQuizTypeModal"; // Type definition and modal component

// ============================================================================
// PROPS INTERFACE
// ============================================================================
/**
 * Props for the PopQuizTypeSection component
 *
 * @interface PopQuizTypeSectionProps
 * @property {any} styles - Theme-aware styles from parent component
 * @property {boolean} isDark - Whether dark mode is active
 * @property {PopQuizType} currentType - Currently selected quiz type
 * @property {function} onChangeType - Callback when user selects a new quiz type
 * @property {function} t - Translation function from i18n
 */
interface PopQuizTypeSectionProps {
  styles: any;
  isDark: boolean;
  currentType: PopQuizType;
  onChangeType: (type: PopQuizType) => void;
  t: (key: string, options?: any) => string;
}

/**
 * ====================================
 * POP QUIZ TYPE SECTION COMPONENT
 * ====================================
 *
 * Displays a clickable settings row that shows the current quiz type and opens a modal
 * for changing the selection.
 */
export function PopQuizTypeSection({
  styles,
  isDark,
  currentType,
  onChangeType,
  t,
}: PopQuizTypeSectionProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  // Controls the visibility of the quiz type selection modal
  const [modalVisible, setModalVisible] = useState(false);

  // ============================================================================
  // HELPER FUNCTION - TYPE LABEL FORMATTER
  // ============================================================================
  /**
   * Converts a quiz type ID to a human-readable label
   *
   * First attempts to get a localized string from translations.
   * If not found, falls back to converting the kebab-case ID to title case.
   *
   * Examples:
   * - "multiple-choice" → "Multiple Choice"
   * - "fill-in-blank" → "Fill In Blank"
   *
   * @param {PopQuizType} type - The quiz type ID (e.g., "multiple-choice")
   * @returns {string} Human-readable label
   */
  const getTypeLabel = (type: PopQuizType) => {
    return t(`settings.popQuizType.types.${type}.title`, {
      defaultValue: type
        .split("-") // Split by hyphen: ["multiple", "choice"]
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize: ["Multiple", "Choice"]
        .join(" "), // Join: "Multiple Choice"
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      {/* ================================================================
          SETTINGS SECTION CONTAINER
          ================================================================
          Standard iOS-style grouped settings section
      */}
      <View style={styles.section}>
        {/* Section title - uppercase label */}
        <ThemedText style={styles.sectionTitle}>
          {t("settings.popQuizType.sectionTitle", {
            defaultValue: "Pop Quiz",
          })}
        </ThemedText>

        {/* Settings card containing the option row */}
        <View style={styles.card}>
          {/* ================================================================
              QUIZ TYPE SELECTOR ROW
              ================================================================
              Tappable row that displays current quiz type and opens modal
          */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => setModalVisible(true)} // Open modal on tap
            activeOpacity={0.7} // Visual feedback on press
          >
            {/* Left side: Icon + Label */}
            <View style={styles.optionLeft}>
              {/* Game controller icon to represent quiz/game feature */}
              <Ionicons
                name="game-controller"
                size={24}
                color={isDark ? "#fff" : "#000"}
              />
              {/* "Quiz Type" label */}
              <ThemedText style={styles.optionText}>
                {t("settings.popQuizType.label", {
                  defaultValue: "Quiz Type",
                })}
              </ThemedText>
            </View>

            {/* Right side: Current selection + Chevron */}
            <View style={localStyles.rightContainer}>
              {/* Display current quiz type (e.g., "Multiple Choice") */}
              <ThemedText style={localStyles.currentValue}>
                {getTypeLabel(currentType)}
              </ThemedText>
              {/* Chevron indicates more options available */}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#8e8e93" : "#c7c7cc"} // Subtle gray
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ================================================================
          QUIZ TYPE SELECTION MODAL
          ================================================================
          Modal that displays all available quiz types with descriptions
          Opens when user taps the option row above
      */}
      <PopQuizTypeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentType={currentType}
        onSelectType={onChangeType}
        isDark={isDark}
      />
    </>
  );
}

// ============================================================================
// LOCAL STYLES
// ============================================================================
/**
 * Component-specific styles for the right side of the option row
 *
 * These styles are separate from parent styles to encapsulate layout logic
 * specific to this component.
 */
const localStyles = StyleSheet.create({
  // Container for current value text and chevron icon
  rightContainer: {
    flexDirection: "row", // Horizontal layout
    alignItems: "center", // Vertically center items
    gap: 8, // Space between text and chevron
  },

  // Current quiz type value text (e.g., "Multiple Choice")
  currentValue: {
    fontSize: 15,
    opacity: 0.6, // Subtle appearance to indicate secondary text
  },
});
