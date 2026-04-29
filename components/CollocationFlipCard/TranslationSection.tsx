import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { getFontColors } from "../../constants/fontColors";
import { styles } from "./EnglishCollocationCardStyle";

interface TranslationSectionProps {
  translation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  maxHeight?: number;
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
  maxHeight,
}: TranslationSectionProps) {
  const fontColors = getFontColors(isDark);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.translationHeader,
          { borderBottomColor: fontColors.learningCardDividerMuted },
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.translationLabel,
            { color: fontColors.learningCardMuted },
          ]}
        >
          TRANSLATION
        </Text>
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={16}
          color={fontColors.learningCardMuted}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.translationSectionContent}>
          <ScrollView
            style={[styles.translationScroll, maxHeight ? { maxHeight } : null]}
            contentContainerStyle={styles.translationScrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <Text
              style={[
                styles.translationValue,
                { color: fontColors.learningCardSecondary },
              ]}
            >
              {translation}
            </Text>
          </ScrollView>
        </View>
      </Collapsible>
    </View>
  );
});
