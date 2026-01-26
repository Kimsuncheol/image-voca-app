import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
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
    if (!roleplay) return null;

    const segments: { type: "role" | "text"; content: string }[] = [];
    const regex = /([.?!]|^)\s*([^.?!:\n]+)(:)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(roleplay)) !== null) {
      const fullMatchStart = match.index;
      const delimiter = match[1];
      const roleName = match[2].trim();

      const preTextEnd = fullMatchStart + delimiter.length;
      if (preTextEnd > lastIndex) {
        const textSegment = roleplay.substring(lastIndex, preTextEnd).trim();
        if (textSegment) {
          segments.push({ type: "text", content: textSegment });
        }
      }

      segments.push({ type: "role", content: roleName });
      lastIndex = fullMatchStart + match[0].length;
    }

    if (lastIndex < roleplay.length) {
      const remainingText = roleplay.substring(lastIndex).trim();
      if (remainingText) {
        segments.push({ type: "text", content: remainingText });
      }
    }

    if (segments.length === 0 && roleplay.length > 0) {
      segments.push({ type: "text", content: roleplay });
    }

    return segments;
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
                  <View key={`dialogue-${i}`} style={styles.dialogueRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: isDark ? "#2c2c2e" : "#e0e0e0" },
                      ]}
                    >
                      <ThemedText style={styles.roleText}>
                        {segment.content}
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="title"
                      style={[styles.roleplayText, contentStyle, { flex: 1 }]}
                    >
                      {textContent}
                    </ThemedText>
                  </View>,
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
    padding: 24,
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
  dialogueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.8,
  },
  roleplayText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "left",
    lineHeight: 32,
  },
});
