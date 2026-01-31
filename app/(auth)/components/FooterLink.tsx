/**
 * =============================================================================
 * FOOTER LINK COMPONENT
 * =============================================================================
 * Footer with text and clickable link
 * - Used for navigation between auth screens (login/register)
 * - Theme-aware styling (dark/light mode)
 * - Blue link text that stands out
 * =============================================================================
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";

// =============================================================================
// PROPS INTERFACE
// =============================================================================
interface FooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

// =============================================================================
// COMPONENT
// =============================================================================
export const FooterLink: React.FC<FooterLinkProps> = ({
  text,
  linkText,
  href,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>{text}</Text>
      <Link href={href} asChild>
        <TouchableOpacity>
          <Text style={styles.link}>{linkText}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    footerText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 14,
    },
    link: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "bold",
      marginLeft: 4,
    },
  });
