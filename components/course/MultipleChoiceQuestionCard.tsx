import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { RoleplayRenderer } from "../CollocationFlipCard/RoleplayRenderer";
import { ThemedText } from "../themed-text";

interface MultipleChoiceQuestionCardProps {
  word?: string;
  roleplay?: string;
  questionLabel?: string;
  questionLabelStyle?: object;
  contentStyle?: object;
}

export function MultipleChoiceQuestionCard({
  word,
  roleplay,
  questionLabel,
  questionLabelStyle,
  contentStyle,
}: MultipleChoiceQuestionCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const label = questionLabel || t("quiz.questions.meaningOf");

  return (
    <View
      style={[
        styles.questionCard,
        { backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" },
      ]}
    >
      <ThemedText style={[styles.questionLabel, questionLabelStyle]}>
        {label}
      </ThemedText>
      {roleplay ? (
        <View style={styles.roleplayContainer}>
          <RoleplayRenderer
            content={roleplay}
            isDark={isDark}
            renderText={(text) => (
              <ThemedText
                type="title"
                style={[styles.roleplayText, contentStyle]}
              >
                {text}
              </ThemedText>
            )}
          />
        </View>
      ) : (
        <ThemedText type="title" style={[styles.wordText, contentStyle]}>
          {word}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  questionCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
    textAlign: "center",
  },
  wordText: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "700",
  },
  roleplayContainer: {
    width: "100%",
    gap: 8,
  },
  roleplayText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 32,
  },
});
