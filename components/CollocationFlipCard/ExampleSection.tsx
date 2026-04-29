import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { getFontColors } from "../../constants/fontColors";
import { useSpeech } from "../../src/hooks/useSpeech";
import { styles } from "./EnglishCollocationCardStyle";
import {
  stripRoleLabels,
  toDialogueTurns,
} from "../../src/utils/roleplayUtils";

const CHARACTER_MIN_WIDTH = 88;
const CHARACTER_MAX_WIDTH = 120;
const CHARACTER_WIDTH_PER_CHAR = 8;
const CHARACTER_BASE_WIDTH = 20;

function splitCharacterWords(character: string): string[] {
  return character.trim().split(/\s+/).filter(Boolean);
}

function formatCharacterLabel(character: string): string {
  return splitCharacterWords(character).join("\n");
}

interface ExampleSectionProps {
  example: string;
  translation?: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  maxHeight?: number;
}

export default React.memo(function ExampleSection({
  example,
  translation,
  isOpen,
  onToggle,
  isDark,
  maxHeight,
}: ExampleSectionProps) {
  const { speak } = useSpeech();
  const fontColors = getFontColors(isDark);
  const spokenExampleText = useMemo(() => stripRoleLabels(example), [example]);
  const exampleTurns = useMemo(() => toDialogueTurns(example), [example]);
  const translationTurns = useMemo(
    () => toDialogueTurns(translation || ""),
    [translation],
  );
  const items = useMemo(
    () =>
      exampleTurns.map((turn, index) => ({
        character: turn.role || "",
        characterLabel: formatCharacterLabel(turn.role || ""),
        exampleText: turn.text,
        translationText: translationTurns[index]?.text || "",
      })),
    [exampleTurns, translationTurns],
  );
  const characterColumnWidth = useMemo(() => {
    const longestWordLength = items.reduce((maxLength, item) => {
      const longestInItem = splitCharacterWords(item.character).reduce(
        (innerMax, word) => Math.max(innerMax, word.length),
        0,
      );
      return Math.max(maxLength, longestInItem);
    }, 0);

    const estimatedWidth =
      longestWordLength * CHARACTER_WIDTH_PER_CHAR + CHARACTER_BASE_WIDTH;

    return Math.max(
      CHARACTER_MIN_WIDTH,
      Math.min(CHARACTER_MAX_WIDTH, estimatedWidth),
    );
  }, [items]);
  const handleSpeakExample = React.useCallback(() => {
    if (!spokenExampleText.trim()) {
      return;
    }

    void speak(spokenExampleText, { language: "en-US" }).catch((error) => {
      console.error("Collocation example TTS error:", error);
    });
  }, [speak, spokenExampleText]);

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
          EXAMPLE
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-forward"}
          size={24}
          color={fontColors.learningCardPrimary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.backSectionContent}>
          {example ? (
            <View style={styles.exampleRow}>
              <View style={styles.exampleContent}>
                <ScrollView
                  style={[
                    styles.exampleScroll,
                    maxHeight ? { maxHeight } : null,
                  ]}
                  contentContainerStyle={styles.exampleScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.exampleScrollText}>
                    <View style={styles.exampleInterleavedContainer}>
                      {items.map((item, index) => (
                        <View
                          key={`dialogue-item-${index}`}
                          style={styles.exampleItemContainer}
                        >
                          <View style={styles.exampleItemRow}>
                            <View
                              style={[
                                styles.exampleCharacterCell,
                                { width: characterColumnWidth },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.exampleCharacterText,
                                  { color: fontColors.learningCardMuted },
                                ]}
                                onPress={handleSpeakExample}
                              >
                                {item.characterLabel}
                              </Text>
                            </View>
                            <View style={styles.exampleContentCell}>
                              <Text
                                style={[
                                  styles.exampleValue,
                                  styles.exampleText,
                                  { color: fontColors.learningCardPrimary },
                                ]}
                                onPress={handleSpeakExample}
                              >
                                {item.exampleText}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.exampleItemRow}>
                            <View
                              style={[
                                styles.exampleCharacterCell,
                                { width: characterColumnWidth },
                              ]}
                            />
                            <View style={styles.exampleContentCell}>
                              <Text
                                testID={
                                  index === 0
                                    ? "collocation-back-translation"
                                    : undefined
                                }
                                style={[
                                  styles.exampleTranslationValue,
                                  { color: fontColors.learningCardMuted },
                                ]}
                                onPress={handleSpeakExample}
                              >
                                {item.translationText}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : null}
        </View>
      </Collapsible>
    </View>
  );
});
