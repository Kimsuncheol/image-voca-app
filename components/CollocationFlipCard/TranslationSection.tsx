import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
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
  return (
    <View>
      <TouchableOpacity
        style={styles.translationHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.translationLabel}>TRANSLATION</Text>
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={16}
          color="#999"
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
            <Text style={[styles.translationValue, isDark && styles.translationTextDark]}>
              {translation}
            </Text>
          </ScrollView>
        </View>
      </Collapsible>
    </View>
  );
});
