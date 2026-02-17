import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { toDialogueTurns } from "../../src/utils/roleplayUtils";
import { SpeakerButton } from "./SpeakerButton";

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

  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.label}>EXAMPLE</Text>
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={16}
          color="#999"
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
                  <View style={styles.scrollContentRow}>
                    <View style={styles.scrollText}>
                      <View style={styles.interleavedContainer}>
                        {items.map((item, index) => (
                          <View key={`dialogue-item-${index}`} style={styles.itemContainer}>
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
                                  style={[
                                    styles.value,
                                    styles.translationValue,
                                    isDark && styles.translationDark,
                                  ]}
                                >
                                  {item.translationText}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                    <SpeakerButton text={example} isDark={isDark} />
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1.2,
  },
  sectionContent: {
    paddingVertical: 8,
    marginBottom: 16,
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
    marginRight: 8,
    minHeight: 0,
  },
  exampleScroll: {
    flexGrow: 0,
  },
  exampleScrollContent: {
    paddingBottom: 4,
    gap: 8,
  },
  scrollContentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  scrollText: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexShrink: 1,
  },
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
    flexShrink: 1,
  },
  textDark: {
    color: "#FFFFFF",
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
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    lineHeight: 22,
    flexShrink: 1,
  },
  characterTextDark: {
    color: "#B3B3B8",
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
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    fontStyle: "normal",
    flexShrink: 1,
  },
  translationDark: {
    color: "#D1D1D6",
  },
});
