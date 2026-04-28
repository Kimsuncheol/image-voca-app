import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { FontSizes } from "@/constants/fontSizes";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";

interface ExplanationSectionProps {
  explanation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

export default React.memo(function ExplanationSection({
  explanation,
  isOpen,
  onToggle,
  isDark: _isDark,
}: ExplanationSectionProps) {
  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>EXPLANATION</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-forward"}
          size={24}
          color={blackCardColors.primary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.sectionContent}>
          <Text style={styles.value}>
            {explanation}
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
    borderBottomWidth: 1.5,
    borderBottomColor: blackCardColors.divider,
    marginBottom: 16,
  },
  label: {
    fontSize: FontSizes.titleMd,
    fontWeight: "800",
    color: blackCardColors.muted,
    letterSpacing: 1.2,
  },
  sectionContent: {
    paddingVertical: 12,
    marginBottom: 28,
  },
  value: {
    fontSize: FontSizes.heading,
    color: blackCardColors.primary,
    lineHeight: 36,
    fontWeight: "500",
  },
});
