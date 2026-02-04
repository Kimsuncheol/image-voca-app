/**
 * Settings Types
 *
 * Shared type definitions for settings screen components
 */

import { StyleProp, TextStyle, ViewStyle } from "react-native";

/**
 * Settings screen styles
 * Used by AdminSection, TeacherSection, and other settings components
 */
export interface SettingsStyles {
  section: ViewStyle;
  sectionTitle: TextStyle;
  card: ViewStyle;
  option: ViewStyle;
  optionLeft: ViewStyle;
  optionText: TextStyle;
  separator: ViewStyle;
  [key: string]: ViewStyle | TextStyle; // Allow additional style keys
}

/**
 * Translation function type
 * Used throughout the app for i18n
 */
export type TranslationFunction = (key: string) => string;

/**
 * Props for settings section components
 */
export interface SettingsSectionProps {
  styles: SettingsStyles;
  t: TranslationFunction;
  isDark?: boolean;
}

/**
 * Props for settings navigation row components
 */
export interface SettingsNavRowProps {
  styles: SettingsStyles;
  isDark: boolean;
  t: TranslationFunction;
}
