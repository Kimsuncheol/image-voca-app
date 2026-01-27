import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Collapsible from "react-native-collapsible";

interface TranslationSectionProps {
  translation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

/**
 * Translation Section Component
 *
 * Collapsible section that displays the Korean translation
 * Extracted from ExampleSection to be separately controlled
 */
export default React.memo(function TranslationSection({
  translation,
  isOpen,
  onToggle,
  isDark,
}: TranslationSectionProps) {
  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>TRANSLATION</Text>
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={16}
          color="#999"
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.sectionContent}>
          <Text style={[styles.value, isDark && styles.textDark]}>
            {translation}
          </Text>
        </View>
      </Collapsible>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1.2,
  },
  sectionContent: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
  },
  textDark: {
    color: "#FFFFFF",
  },
});
