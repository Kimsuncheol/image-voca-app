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
import { RoleplayRenderer } from "./RoleplayRenderer";

interface ExampleSectionProps {
  example: string;
  translation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  parentHeight?: number;
}

export default React.memo(function ExampleSection({
  example,
  translation,
  isOpen,
  onToggle,
  isDark,
  parentHeight,
}: ExampleSectionProps) {
  const { height: windowHeight } = useWindowDimensions();
  const height = parentHeight || windowHeight;
  const speak = React.useCallback(() => {
    Speech.speak(example);
  }, [example]);

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
          style={[styles.sectionContent, { maxHeight: height * 0.7 }]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {example ? (
            // roleplay
            <View style={styles.exampleRow}>
              <View style={{ flex: 1, marginRight: 8, gap: 8 }}>
                <RoleplayRenderer content={example} isDark={isDark} />
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
