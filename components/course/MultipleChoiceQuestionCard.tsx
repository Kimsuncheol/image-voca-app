import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { parseRoleplaySegments } from "../../src/utils/roleplayUtils";
import { RoleplayDialogueRow } from "../RoleplayDialogueRow";
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

  const parsedRoleplaySegments = React.useMemo(() => {
    return parseRoleplaySegments(roleplay || "");
  }, [roleplay]);

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
      {parsedRoleplaySegments ? (
        <View style={styles.roleplayContainer}>
          {(() => {
            const nodes = [];
            let i = 0;
            while (i < parsedRoleplaySegments.length) {
              const segment = parsedRoleplaySegments[i];
              if (segment.type === "role") {
                let textContent = "";
                if (
                  i + 1 < parsedRoleplaySegments.length &&
                  parsedRoleplaySegments[i + 1].type === "text"
                ) {
                  textContent = parsedRoleplaySegments[i + 1].content;
                  i += 2;
                } else {
                  i += 1;
                }

                nodes.push(
                  <RoleplayDialogueRow
                    key={`dialogue-${i}`}
                    role={segment.content}
                    text={
                      <ThemedText
                        type="title"
                        style={[styles.roleplayText, contentStyle]}
                      >
                        {textContent}
                      </ThemedText>
                    }
                  />,
                );
              } else {
                nodes.push(
                  <ThemedText
                    key={`text-${i}`}
                    type="title"
                    style={[styles.roleplayText, contentStyle]}
                  >
                    {segment.content}
                  </ThemedText>,
                );
                i += 1;
              }
            }
            return nodes;
          })()}
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
