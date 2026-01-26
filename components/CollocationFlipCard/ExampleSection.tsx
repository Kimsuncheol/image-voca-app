import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { parseRoleplaySegments } from "../../src/utils/roleplayUtils";
import { RoleplayDialogueRow } from "../RoleplayDialogueRow";

interface ExampleSectionProps {
  example: string;
  translation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  parentHeight?: number;
}

export default function ExampleSection({
  example,
  translation,
  isOpen,
  onToggle,
  isDark,
  parentHeight,
}: ExampleSectionProps) {
  const { height: windowHeight } = useWindowDimensions();
  const height = parentHeight || windowHeight;
  const speak = () => {
    Speech.speak(example);
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
        <ScrollView
          style={[styles.sectionContent, { maxHeight: height * 0.8 }]}
          nestedScrollEnabled
        >
          {example ? (
            <View style={styles.exampleRow}>
              <View style={{ flex: 1, marginRight: 8, gap: 8 }}>
                {(() => {
                  const segments = parseRoleplaySegments(example);
                  if (!segments) return null;

                  const nodes = [];
                  let i = 0;
                  while (i < segments.length) {
                    const segment = segments[i];
                    if (segment.type === "role") {
                      let textContent = "";
                      if (
                        i + 1 < segments.length &&
                        segments[i + 1].type === "text"
                      ) {
                        textContent = segments[i + 1].content;
                        i += 2;
                      } else {
                        i += 1;
                      }

                      nodes.push(
                        <RoleplayDialogueRow
                          key={`dialogue-${i}`}
                          role={segment.content}
                          text={
                            <Text
                              style={[
                                styles.value,
                                isDark && styles.textDark,
                                styles.exampleText,
                                { fontStyle: "normal" }, // Reset italic for dialogue
                              ]}
                            >
                              &quot;{textContent}&quot;
                            </Text>
                          }
                        />,
                      );
                    } else {
                      nodes.push(
                        <Text
                          key={`text-${i}`}
                          style={[
                            styles.value,
                            isDark && styles.textDark,
                            styles.exampleText,
                          ]}
                        >
                          &quot;{segment.content}&quot;
                        </Text>,
                      );
                      i += 1;
                    }
                  }
                  return nodes;
                })()}
              </View>
              <TouchableOpacity onPress={speak} style={styles.speakerButton}>
                <Ionicons
                  name="volume-medium"
                  size={20}
                  color={isDark ? "#ccc" : "#999"}
                />
              </TouchableOpacity>
            </View>
          ) : null}

          <View>
            <Text style={[styles.subLabel, { marginBottom: 4 }]}>
              TRANSLATION
            </Text>
            <Text style={[styles.value, isDark && styles.textDark]}>
              {translation}
            </Text>
          </View>
        </ScrollView>
      </Collapsible>
    </View>
  );
}

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
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  textDark: {
    color: "#FFFFFF",
    borderColor: "#FFFFFF", // Also useful for border colors in dark mode if needed
  },
  exampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  exampleText: {
    fontStyle: "italic",
    flex: 1,
    marginRight: 8,
  },
  speakerButton: {
    padding: 4,
    marginTop: -2, // Align with text
  },
});
