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
import {
  DialogueTurn,
  stripRoleLabels,
  toDialogueTurns,
} from "../../src/utils/roleplayUtils";
import { RoleplayDialogueRow } from "../RoleplayDialogueRow";
import { RoleplayRenderer } from "./RoleplayRenderer";
import { SpeakerButton } from "./SpeakerButton";

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
  const fallbackTranslation = useMemo(
    () => stripRoleLabels(translation || ""),
    [translation],
  );

  const hasTranslation = Boolean(translation?.trim());
  const canInterleave =
    hasTranslation &&
    exampleTurns.length > 0 &&
    translationTurns.length > 0 &&
    exampleTurns.length === translationTurns.length;

  const renderExampleTurn = (turn: DialogueTurn, index: number) => {
    if (turn.role) {
      return (
        <RoleplayDialogueRow
          key={`example-turn-${index}`}
          role={turn.role}
          text={
            <Text style={[styles.value, styles.exampleText, isDark && styles.textDark]}>
              &quot;{turn.text}&quot;
            </Text>
          }
        />
      );
    }

    return (
      <Text
        key={`example-turn-${index}`}
        style={[styles.value, styles.exampleText, isDark && styles.textDark]}
      >
        &quot;{turn.text}&quot;
      </Text>
    );
  };

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
                      {canInterleave ? (
                        <View style={styles.interleavedContainer}>
                          {exampleTurns.map((turn, index) => (
                            <View key={`pair-${index}`} style={styles.interleavedPair}>
                              {renderExampleTurn(turn, index)}
                              <Text
                                style={[
                                  styles.value,
                                  styles.translationValue,
                                  isDark && styles.translationDark,
                                ]}
                              >
                                {translationTurns[index].text}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={styles.nonInterleavedContainer}>
                          <RoleplayRenderer content={example} isDark={isDark} />
                          {hasTranslation && fallbackTranslation ? (
                            <Text
                              style={[
                                styles.value,
                                styles.translationValue,
                                styles.translationFallback,
                                isDark && styles.translationDark,
                              ]}
                            >
                              {fallbackTranslation}
                            </Text>
                          ) : null}
                        </View>
                      )}
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
  },
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  exampleContent: {
    flex: 1,
    marginRight: 8,
  },
  exampleScroll: {
    maxHeight: 140,
  },
  exampleScrollContent: {
    paddingBottom: 4,
    gap: 8,
  },
  scrollContentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  scrollText: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
  },
  textDark: {
    color: "#FFFFFF",
  },
  exampleText: {
    fontStyle: "normal",
    flex: 1,
    marginRight: 8,
  },
  interleavedContainer: {
    gap: 12,
  },
  interleavedPair: {
    gap: 6,
  },
  nonInterleavedContainer: {
    gap: 10,
  },
  translationValue: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    fontStyle: "normal",
  },
  translationDark: {
    color: "#D1D1D6",
  },
  translationFallback: {
    marginTop: 4,
    paddingTop: 8,
  },
});
