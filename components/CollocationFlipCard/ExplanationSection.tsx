import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { getFontColors } from "../../constants/fontColors";
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
  isDark,
}: ExplanationSectionProps) {
  const fontColors = getFontColors(isDark);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.backSectionHeader,
          { borderBottomColor: fontColors.learningCardDivider },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.backSectionLabel,
            { color: fontColors.learningCardMuted },
          ]}
        >
          EXPLANATION
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-forward"}
          size={24}
          color={fontColors.learningCardPrimary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.backSectionContent}>
          <Text
            style={[
              styles.explanationValue,
              { color: fontColors.learningCardPrimary },
            ]}
          >
            {explanation}
          </Text>
        </View>
      </Collapsible>
    </View>
  );
});
