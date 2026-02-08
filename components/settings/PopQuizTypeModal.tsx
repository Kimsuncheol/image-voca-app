/**
 * ====================================
 * POP QUIZ TYPE MODAL COMPONENT
 * ====================================
 *
 * This modal allows users to select the type of pop quiz they want to see on the dashboard.
 * It displays all available quiz types with icons, descriptions, and visual feedback for
 * the currently selected type.
 *
 * The modal uses a bottom sheet slide-up animation and includes a backdrop that can be
 * tapped to dismiss the modal.
 */

// ============================================================================
// IMPORTS
// ============================================================================
import { Ionicons } from "@expo/vector-icons"; // Icon library
import React from "react";
import { useTranslation } from "react-i18next"; // i18n for localization
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../themed-text"; // Theme-aware text component

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
/**
 * Available pop quiz types
 *
 * - multiple-choice: Choose the correct meaning from 4 options
 * - fill-in-blank: Complete the sentence with the correct word
 * - word-arrangement: Arrange words to form the correct sentence
 * - matching: Match 4 words with their meanings
 */
export type PopQuizType =
  | "multiple-choice"
  | "fill-in-blank"
  | "word-arrangement"
  | "matching";

// ============================================================================
// PROPS INTERFACE
// ============================================================================
/**
 * Props for the PopQuizTypeModal component
 *
 * @interface PopQuizTypeModalProps
 * @property {boolean} visible - Whether the modal is visible
 * @property {function} onClose - Callback to close the modal
 * @property {PopQuizType} currentType - Currently selected quiz type
 * @property {function} onSelectType - Callback when user selects a quiz type
 * @property {boolean} isDark - Whether dark mode is active
 */
interface PopQuizTypeModalProps {
  visible: boolean;
  onClose: () => void;
  currentType: PopQuizType;
  onSelectType: (type: PopQuizType) => void;
  isDark: boolean;
}

// ============================================================================
// QUIZ TYPE CONFIGURATION
// ============================================================================
/**
 * Configuration for all available quiz types
 *
 * Each quiz type has:
 * - id: Unique identifier matching the PopQuizType union
 * - icon: Ionicons name for visual representation
 * - color: Brand color for that quiz type (used for icons and selected state)
 *
 * Colors follow iOS design guidelines:
 * - Blue (#007AFF): System blue, indicates standard interaction
 * - Green (#34C759): Success/positive action
 * - Orange (#FF9500): Warning/attention
 * - Purple (#AF52DE): Creative/unique functionality
 */
const QUIZ_TYPES: {
  id: PopQuizType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    id: "multiple-choice",
    icon: "list", // List icon represents multiple options
    color: "#007AFF", // iOS system blue
  },
  {
    id: "fill-in-blank",
    icon: "create", // Pencil icon represents writing/input
    color: "#34C759", // iOS system green
  },
  {
    id: "word-arrangement",
    icon: "swap-horizontal", // Swap icon represents rearranging
    color: "#FF9500", // iOS system orange
  },
  {
    id: "matching",
    icon: "link", // Link icon represents connecting items
    color: "#AF52DE", // iOS system purple
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * PopQuizTypeModal - Bottom sheet modal for selecting quiz type
 *
 * Displays all available quiz types in a scrollable list with:
 * - Icon and color coding for each type
 * - Title and description
 * - Visual indicator for currently selected type
 * - Smooth slide-up animation
 */
export function PopQuizTypeModal({
  visible,
  onClose,
  currentType,
  onSelectType,
  isDark,
}: PopQuizTypeModalProps) {
  // Translation function from i18n
  const { t } = useTranslation();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  /**
   * Handles quiz type selection
   *
   * When user taps a quiz type:
   * 1. Calls the onSelectType callback with the selected type
   * 2. Closes the modal immediately
   *
   * @param {PopQuizType} type - The selected quiz type
   */
  const handleSelect = (type: PopQuizType) => {
    onSelectType(type); // Notify parent component of selection
    onClose(); // Dismiss modal
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <Modal
      visible={visible} // Controls modal visibility
      transparent // Allows backdrop to show through
      animationType="slide" // Slide up from bottom animation
      onRequestClose={onClose} // Android back button handler
    >
      {/* ================================================================
          OVERLAY CONTAINER
          ================================================================
          Full-screen container that positions modal at bottom
      */}
      <View style={styles.overlay}>
        {/* ================================================================
            BACKDROP
            ================================================================
            Semi-transparent overlay that can be tapped to dismiss modal
        */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1} // Prevents opacity change on press
          onPress={onClose} // Tap to dismiss
        />

        {/* ================================================================
            MODAL CONTENT
            ================================================================
            Bottom sheet containing quiz type options
        */}
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? "#1c1c1e" : "#fff" }, // Theme-aware background
          ]}
        >
          {/* ================================================================
              HEADER SECTION
              ================================================================
              Title and close button
          */}
          <View style={styles.header}>
            {/* Modal title */}
            <ThemedText type="title" style={styles.title}>
              {t("settings.popQuizType.title", {
                defaultValue: "Pop Quiz Type",
              })}
            </ThemedText>

            {/* Close button (X icon) */}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>

          {/* ================================================================
              DESCRIPTION TEXT
              ================================================================
              Explains what this modal is for
          */}
          <ThemedText style={styles.description}>
            {t("settings.popQuizType.description", {
              defaultValue:
                "Choose the type of questions for the dashboard pop quiz",
            })}
          </ThemedText>

          {/* ================================================================
              QUIZ TYPE OPTIONS LIST
              ================================================================
              Scrollable list of all available quiz types
          */}
          <ScrollView style={styles.optionsContainer}>
            {QUIZ_TYPES.map((quizType) => {
              // Check if this is the currently selected quiz type
              const isSelected = currentType === quizType.id;

              return (
                <TouchableOpacity
                  key={quizType.id}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isDark ? "#2c2c2e" : "#f5f5f5", // Card background
                      borderColor: isSelected
                        ? quizType.color // Colored border if selected
                        : "transparent", // No border if not selected
                    },
                  ]}
                  onPress={() => handleSelect(quizType.id)} // Handle selection
                  activeOpacity={0.7} // Visual feedback on press
                >
                  {/* Left side: Icon + Text */}
                  <View style={styles.optionLeft}>
                    {/* Colored icon container */}
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: quizType.color }, // Each type has unique color
                      ]}
                    >
                      {/* Quiz type icon */}
                      <Ionicons
                        name={quizType.icon}
                        size={24}
                        color="#fff" // White icon on colored background
                      />
                    </View>

                    {/* Text container */}
                    <View style={styles.optionTextContainer}>
                      {/* Quiz type title (e.g., "Multiple Choice") */}
                      <ThemedText style={styles.optionTitle}>
                        {t(`settings.popQuizType.types.${quizType.id}.title`, {
                          defaultValue: quizType.id
                            .split("-") // ["multiple", "choice"]
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1), // ["Multiple", "Choice"]
                            )
                            .join(" "), // "Multiple Choice"
                        })}
                      </ThemedText>

                      {/* Quiz type description */}
                      <ThemedText style={styles.optionDescription}>
                        {t(
                          `settings.popQuizType.types.${quizType.id}.description`,
                          {
                            defaultValue: getDefaultDescription(quizType.id),
                          },
                        )}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Right side: Checkmark if selected */}
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={quizType.color} // Checkmark color matches quiz type color
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Gets the default description for a quiz type
 *
 * Used as a fallback when translations are not available.
 * Each description briefly explains how the quiz type works.
 *
 * @param {PopQuizType} type - The quiz type ID
 * @returns {string} Default description in English
 */
function getDefaultDescription(type: PopQuizType): string {
  switch (type) {
    case "multiple-choice":
      return "Choose the correct meaning from 4 options";
    case "fill-in-blank":
      return "Complete the sentence with the correct word";
    case "word-arrangement":
      return "Arrange words to form the correct sentence";
    case "matching":
      return "Match 4 words with their meanings";
    default:
      return "";
  }
}

// ============================================================================
// STYLES
// ============================================================================
/**
 * Styles for the bottom sheet modal
 *
 * Design follows iOS modal patterns:
 * - Bottom sheet with rounded top corners
 * - Semi-transparent backdrop
 * - Card-based layout for options
 * - Visual selection indicators
 */
const styles = StyleSheet.create({
  // Full-screen overlay container
  overlay: {
    flex: 1,
    justifyContent: "flex-end", // Position modal at bottom
  },

  // Semi-transparent backdrop behind modal
  backdrop: {
    ...StyleSheet.absoluteFillObject, // Fill entire screen
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 50% black overlay
  },

  // Modal content container (bottom sheet)
  modalContent: {
    borderTopLeftRadius: 20, // Rounded top corners
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40, // Extra bottom padding for safe area
    paddingHorizontal: 20,
    maxHeight: "80%", // Limit height to 80% of screen
  },

  // Header row (title + close button)
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // Title left, button right
    alignItems: "center",
    marginBottom: 12,
  },

  // Modal title text
  title: {
    fontSize: 24,
    fontWeight: "700", // Bold
  },

  // Close button (X icon)
  closeButton: {
    padding: 4, // Touch target padding
  },

  // Description text below title
  description: {
    fontSize: 14,
    opacity: 0.7, // Slightly faded for secondary text
    marginBottom: 20,
  },

  // ScrollView container for quiz type options
  optionsContainer: {
    gap: 12, // Space between options
  },

  // Individual quiz type option card
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Content left, checkmark right
    padding: 16,
    borderRadius: 12, // Rounded corners
    marginBottom: 12, // Space between cards
    borderWidth: 2, // Border for selected state
  },

  // Left side of option (icon + text)
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Take available space
  },

  // Circular container for quiz type icon
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24, // Perfect circle
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12, // Space before text
  },

  // Container for title and description text
  optionTextContainer: {
    flex: 1, // Fill remaining space
  },

  // Quiz type title (e.g., "Multiple Choice")
  optionTitle: {
    fontSize: 16,
    fontWeight: "600", // Semi-bold
    marginBottom: 4, // Space before description
  },

  // Quiz type description text
  optionDescription: {
    fontSize: 13,
    opacity: 0.6, // Faded for secondary text
  },
});
