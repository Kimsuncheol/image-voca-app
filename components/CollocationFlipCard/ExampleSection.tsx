import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FontSizes } from "@/constants/fontSizes";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { useSpeech } from "../../src/hooks/useSpeech";
import { blackCardColors } from "../course/vocabulary/blackCardStyles";
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
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>EXAMPLE</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-forward"}
          size={24}
          color={blackCardColors.primary}
        />
      </TouchableOpacity>

      <Collapsible collapsed={!isOpen}>
        <View style={styles.sectionContent}>
          {example ? (
            <View style={styles.exampleRow}>
              <View style={styles.exampleContent}>
                <ScrollView
                  style={[
                    styles.exampleScroll,
                    maxHeight ? { maxHeight } : null,
                  ]}
                  contentContainerStyle={styles.exampleScrollContent}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled={true}
                >
                  <View style={styles.scrollText}>
                    <View style={styles.interleavedContainer}>
                      {items.map((item, index) => (
                        <View
                          key={`dialogue-item-${index}`}
                          style={styles.itemContainer}
                        >
                          <View style={styles.itemRow}>
                            <View
                              style={[
                                styles.characterCell,
                                { width: characterColumnWidth },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.characterText,
                                  isDark && styles.characterTextDark,
                                ]}
                                onPress={handleSpeakExample}
                              >
                                {item.characterLabel}
                              </Text>
                            </View>
                            <View style={styles.contentCell}>
                              <Text
                                style={[
                                  styles.value,
                                  styles.exampleText,
                                  isDark && styles.textDark,
                                ]}
                                onPress={handleSpeakExample}
                              >
                                {item.exampleText}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.itemRow}>
                            <View
                              style={[
                                styles.characterCell,
                                { width: characterColumnWidth },
                              ]}
                            />
                            <View style={styles.contentCell}>
                              <Text
                                testID={
                                  index === 0
                                    ? "collocation-back-translation"
                                    : undefined
                                }
                                style={[
                                  styles.value,
                                  styles.translationValue,
                                  { color: blackCardColors.muted },
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: blackCardColors.divider,
    marginBottom: 16,
  },
  label: {
    fontSize: FontSizes.titleMd,
    fontWeight: "800",
    color: blackCardColors.muted,
    letterSpacing: 1.2,
  },
  sectionContent: {
    paddingVertical: 12,
    marginBottom: 28,
    flexShrink: 1,
    minHeight: 0,
  },
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minHeight: 0,
  },
  exampleContent: {
    flex: 1,
    minHeight: 0,
  },
  exampleScroll: {
    flexGrow: 0,
  },
  exampleScrollContent: {
    paddingBottom: 4,
    gap: 8,
  },
  scrollText: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexShrink: 1,
  },
  value: {
    fontSize: FontSizes.titleLg,
    color: blackCardColors.primary,
    lineHeight: 32,
    fontWeight: "500",
    flexShrink: 1,
  },
  textDark: {
    color: blackCardColors.primary,
  },
  exampleText: {
    fontStyle: "normal",
    flexShrink: 1,
  },
  characterCell: {
    paddingRight: 10,
    justifyContent: "flex-start",
  },
  characterText: {
    fontSize: FontSizes.bodyLg,
    fontWeight: "600",
    color: blackCardColors.muted,
    lineHeight: 26,
    flexShrink: 1,
  },
  characterTextDark: {
    color: blackCardColors.muted,
  },
  interleavedContainer: {
    gap: 12,
  },
  itemContainer: {
    gap: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentCell: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  translationValue: {
    fontSize: FontSizes.bodyLg,
    lineHeight: 24,
    fontStyle: "normal",
    flexShrink: 1,
    opacity: 1,
  },
});
