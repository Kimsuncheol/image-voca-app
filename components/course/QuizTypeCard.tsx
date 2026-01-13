import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { ThemedText } from "../themed-text";

interface QuizType {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

interface QuizTypeCardProps {
  quizType: QuizType;
  onPress: () => void;
}

export function QuizTypeCard({ quizType, onPress }: QuizTypeCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.quizCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: quizType.color + "20" },
        ]}
      >
        <Ionicons
          name={quizType.icon as any}
          size={32}
          color={quizType.color}
        />
      </View>
      <ThemedText type="subtitle" style={styles.quizTitle}>
        {t(quizType.titleKey, { defaultValue: quizType.title })}
      </ThemedText>
      <ThemedText style={styles.quizDescription}>
        {t(quizType.descriptionKey, {
          defaultValue: quizType.description,
        })}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quizCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: "center",
  },
});
