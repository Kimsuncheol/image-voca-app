import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Collapsible from "react-native-collapsible";

interface ExampleSectionProps {
  example: string;
  translation: string;
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
}

export default function ExampleSection({
  example,
  translation,
  isOpen,
  onToggle,
  isDark,
}: ExampleSectionProps) {
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
            <View style={{ marginBottom: 16 }}>
              <Text
                style={[
                  styles.value,
                  isDark && styles.textDark,
                  { fontStyle: "italic" },
                ]}
              >
                &quot;{example}&quot;
              </Text>
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
        </View>
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
  },
});
