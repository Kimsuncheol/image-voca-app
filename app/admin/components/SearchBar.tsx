/**
 * =============================================================================
 * SEARCH BAR COMPONENT
 * =============================================================================
 * Search input for filtering members by name or email
 *
 * FEATURES:
 * - Real-time search as user types
 * - Searches through member display names and email addresses
 * - Clear button (X) appears when text is entered
 * - Icon indicators for search functionality
 * - Accessible placeholder text
 * - Theme-aware styling (dark/light mode)
 *
 * USER INTERACTIONS:
 * - Type to filter: Updates search query on each keystroke
 * - Clear button: Taps X icon to clear search and show all members
 *
 * USAGE:
 * Placed below stats overview and above filters in admin dashboard.
 * Works in conjunction with filter chips for combined filtering.
 *
 * TECHNICAL DETAILS:
 * - Case-insensitive search (handled by parent)
 * - Controlled component pattern (value + onChange)
 * - No debouncing (immediate feedback)
 * =============================================================================
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// =============================================================================
// PROPS INTERFACE
// =============================================================================

interface SearchBarProps {
  /** Current search query value */
  value: string;

  /** Callback fired when search text changes */
  onChangeText: (text: string) => void;

  /** Dark mode flag for theming */
  isDark: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SearchBar Component
 *
 * Renders a horizontal search input with:
 * - Left: Search icon (visual indicator)
 * - Center: Text input field
 * - Right: Clear button (conditionally shown when text exists)
 *
 * The parent component handles the actual filtering logic by comparing
 * the search query against member names and emails.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  isDark,
}) => {
  const { t } = useTranslation();
  const styles = getStyles(isDark);

  /**
   * Handle clear button press
   * Resets search query to empty string, showing all members
   */
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.searchContainer}>
      {/* Search Icon - Visual indicator for search functionality */}
      <Ionicons
        name="search"
        size={20}
        color={isDark ? '#666' : '#999'}
      />

      {/* Text Input - Main search field */}
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('admin.members.searchPlaceholder')}
        placeholderTextColor={isDark ? '#666' : '#999'}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Clear Button - Only visible when search has text */}
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color={isDark ? '#666' : '#999'}
          />
        </TouchableOpacity>
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
 * STYLE STRUCTURE:
 * - searchContainer: Horizontal flex layout with padding and rounded corners
 * - searchInput: Flexible text input that takes remaining space
 *
 * THEME VARIATIONS:
 * - Dark mode: Dark background (#1a1a1a) with light text
 * - Light mode: White background with dark text
 *
 * ACCESSIBILITY:
 * - 12px gap between elements for touch targets
 * - Minimum 44px height for iOS touch guidelines (via padding)
 */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
  });
