import { getBackgroundColors } from "@/constants/backgroundColors";
import { getBorderColors } from "@/constants/borderColors";
import { getFontColors } from "@/constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { LineHeights } from "@/constants/lineHeights";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { stripKanaParens } from "../../src/utils/japaneseText";
import { RoleplayRenderer } from "../CollocationFlipCard/RoleplayRenderer";
import { ThemedText } from "../themed-text";

interface FillInTheBlankGameClozeSentenceCardProps {
  clozeSentence: string;
  translation?: string;
  localizedPronunciation?: string;
  userAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  correctForms?: string[];
  onCardPress?: () => void;
  onBlankPress?: () => void;
}

export function FillInTheBlankGameClozeSentenceCard({
  clozeSentence,
  translation,
  localizedPronunciation,
  userAnswer,
  showResult,
  isCorrect,
  correctForms = [],
  onCardPress,
  onBlankPress,
}: FillInTheBlankGameClozeSentenceCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const fontColors = getFontColors(isDark);
  const backgroundColors = getBackgroundColors(isDark);
  const borderColors = getBorderColors(isDark);
  const displaySentence = React.useMemo(
    () => stripKanaParens(clozeSentence),
    [clozeSentence],
  );

  // Parse the sentence to separate text and blanks
  const renderTextWithBlanks = (
    text: string,
    blankCounter: { current: number },
  ) => {
    // Split by newlines to handle multiple sentences
    const lines = text.split("\n").filter((line) => line.trim());

    return lines.map((line, lineIndex) => {
      const parts = line.split(/(_+)/);

      return (
        <View key={`${lineIndex}`} style={styles.sentenceLine}>
          <Text
            style={[
              styles.sentenceText,
              { color: fontColors.fillBlankSentence },
            ]}
          >
            {parts.map((part, partIndex) => {
              const isBlank = /^_+$/.test(part);
              if (!isBlank) {
                return <React.Fragment key={partIndex}>{part}</React.Fragment>;
              }

              const currentBlankIndex = blankCounter.current++;
              // If correct answer is selected (isCorrect), show the proper tense form (correctForms[index])
              // Otherwise show the user's selected base word
              const displayWord =
                userAnswer && isCorrect && correctForms[currentBlankIndex]
                  ? correctForms[currentBlankIndex]
                  : userAnswer || "         ";

              return (
                <React.Fragment key={partIndex}>
                  <Text
                    testID={`fill-in-blank-cloze-blank-${currentBlankIndex}`}
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      onBlankPress?.();
                    }}
                    style={[
                      styles.blank,
                      {
                        backgroundColor: userAnswer
                          ? showResult
                            ? isCorrect
                              ? backgroundColors.fillBlankCorrectSoft
                              : backgroundColors.fillBlankIncorrectSoft
                            : backgroundColors.fillBlankIdle
                          : backgroundColors.fillBlankIdle,
                        borderColor: userAnswer
                          ? showResult
                            ? isCorrect
                              ? borderColors.fillBlankCorrect
                              : borderColors.fillBlankIncorrect
                            : borderColors.fillBlankIdle
                          : borderColors.fillBlankIdle,
                        color: userAnswer
                          ? showResult
                            ? isCorrect
                              ? fontColors.fillBlankCorrect
                              : fontColors.fillBlankIncorrect
                            : fontColors.fillBlankActive
                          : fontColors.fillBlankIdle,
                        minWidth: displayWord === "          " ? 26 : undefined,
                        paddingHorizontal: displayWord === "         " ? 4 : 8,
                      },
                    ]}
                  >
                    {displayWord}
                  </Text>
                </React.Fragment>
              );
            })}
          </Text>
        </View>
      );
    });
  };

  const renderContent = () => {
    // We use a mutable ref for blank counting across the whole renderer
    const blankCounter = { current: 0 };

    return (
      <View style={{ gap: 8 }}>
        <RoleplayRenderer
          content={displaySentence}
          isDark={isDark}
          renderText={(text) => renderTextWithBlanks(text, blankCounter)}
        />
      </View>
    );
  };

  return (
    <Pressable
      testID="fill-in-blank-example-container"
      accessible={false}
      onPress={(event) => {
        event?.stopPropagation?.();
        onCardPress?.();
      }}
      style={[
        styles.sentenceCard,
        {
          backgroundColor: backgroundColors.fillBlankCard,
          borderColor: borderColors.fillBlankCard,
        },
      ]}
    >
      <ThemedText style={styles.sentenceLabel}>
        {t("quiz.types.fillInBlank.completeSentence")}
      </ThemedText>
      {renderContent()}
      {translation && (
        <ThemedText style={styles.translationText}>{translation}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sentenceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sentenceLabel: {
    fontSize: FontSizes.body,
    opacity: 0.6,
    marginBottom: 12,
  },
  sentenceLine: {
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: FontSizes.title,
    lineHeight: LineHeights.headingMd,
    textAlign: "left",
  },
  blank: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: "dashed",
    fontWeight: FontWeights.semiBold,
    fontSize: FontSizes.title,
    minWidth: 26,
    overflow: "hidden",
  },
  translationText: {
    fontSize: FontSizes.body,
    opacity: 0.7,
    marginTop: 8,
  },
});
