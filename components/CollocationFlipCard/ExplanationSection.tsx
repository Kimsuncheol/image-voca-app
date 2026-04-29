import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";
import { styles } from "./EnglishCollocationCardStyle";

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
        style={styles.backSectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.backSectionLabel}>EXPLANATION</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-forward"}
          size={24}
          color={blackCardColors.primary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.backSectionContent}>
          <Text style={styles.explanationValue}>
            {explanation}
          </Text>
        </View>
      </Collapsible>
    </View>
  );
});
