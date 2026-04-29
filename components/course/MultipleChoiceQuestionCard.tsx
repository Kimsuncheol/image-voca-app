import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { getIdiomTitleFontSize } from "../../src/utils/idiomDisplay";
import { RoleplayRenderer } from "../CollocationFlipCard/RoleplayRenderer";
import { ThemedText } from "../themed-text";
import { FontSizes } from "@/constants/fontSizes";
import { LineHeights } from "@/constants/lineHeights";

interface MultipleChoiceQuestionCardProps {
  word?: string;
  courseId?: string;
  roleplay?: string;
  questionLabel?: string;
  questionLabelStyle?: object;
  contentStyle?: object;
  highlightText?: string;
  showResult?: boolean;
  correctAnswer?: string;
}

export function MultipleChoiceQuestionCard({
  word,
  courseId,
  roleplay,
  questionLabel,
  questionLabelStyle,
  contentStyle,
  highlightText,
  showResult,
  correctAnswer,
}: MultipleChoiceQuestionCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const label = questionLabel || t("quiz.questions.meaningOf");
  const wordFontSize = React.useMemo(
    () => getIdiomTitleFontSize(word ?? "", courseId, 32),
    [courseId, word],
  );
  const wordLineHeight = React.useMemo(
    () => Math.round(wordFontSize * 1.15),
    [wordFontSize],
  );

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
            renderText={(text) => {
              if (
                highlightText &&
                text.toLowerCase().includes(highlightText.toLowerCase())
              ) {
                // If showing result, replace the highlighted text with correct answer
                if (showResult && correctAnswer) {
                  const parts = text.split(
                    new RegExp(`(${highlightText})`, "gi"),
                  );
                  return (
                    <ThemedText
                      type="title"
                      style={[styles.roleplayText, contentStyle]}
                    >
                      {parts.map((part, index) =>
                        part.toLowerCase() === highlightText.toLowerCase() ? (
                          <Text
                            key={index}
                            style={{
                              color: "#34c759", // Green for correct
                              fontWeight: "700",
                            }}
                          >
                            {correctAnswer}
                          </Text>
                        ) : (
                          <Text key={index}>{part}</Text>
                        ),
                      )}
                    </ThemedText>
                  );
                }

                const parts = text.split(
                  new RegExp(`(${highlightText})`, "gi"),
                );
                return (
                  <ThemedText
                    type="title"
                    style={[styles.roleplayText, contentStyle]}
                  >
                    {parts.map((part, index) =>
                      part.toLowerCase() === highlightText.toLowerCase() ? (
                        <Text
                          key={index}
                          style={{
                            textDecorationLine: "underline",
                            textDecorationColor: "#ff3b30",
                            color: "#ff3b30",
                          }}
                        >
                          {part}
                        </Text>
                      ) : (
                        <Text key={index}>{part}</Text>
                      ),
                    )}
                  </ThemedText>
                );
              }

              return (
                <ThemedText
                  type="title"
                  style={[styles.roleplayText, contentStyle]}
                >
                  {text}
                </ThemedText>
              );
            }}
          />
        </View>
      ) : (
        <ThemedText
          testID="multiple-choice-question-word"
          type="title"
          style={[
            styles.wordText,
            contentStyle,
            { fontSize: wordFontSize, lineHeight: wordLineHeight },
          ]}
        >
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
    fontSize: FontSizes.body,
    opacity: 0.6,
    marginBottom: 8,
    textAlign: "center",
  },
  wordText: {
    fontSize: FontSizes.headingXl,
    textAlign: "center",
    fontWeight: "700",
  },
  roleplayContainer: {
    width: "100%",
    gap: 8,
  },
  roleplayText: {
    fontSize: FontSizes.heading,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: LineHeights.headingXl,
  },
});
