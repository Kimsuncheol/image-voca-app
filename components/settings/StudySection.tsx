import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "../themed-text";

interface StudySectionProps {
  styles: any;
  isDark: boolean;
  targetScore: number;
  onUpdateTargetScore: (score: number) => void;
  t: (key: string, options?: any) => string;
}

export function StudySection({
  styles,
  isDark,
  targetScore,
  onUpdateTargetScore,
  t,
}: StudySectionProps) {
  const [localValue, setLocalValue] = useState(targetScore.toString());

  // Sync local value when targetScore changes from external source
  useEffect(() => {
    setLocalValue(targetScore.toString());
  }, [targetScore]);

  const handleTextChange = (text: string) => {
    setLocalValue(text);
  };

  const handleBlur = () => {
    const score = parseInt(localValue.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(score)) {
      onUpdateTargetScore(score);
    } else {
      onUpdateTargetScore(0);
      setLocalValue("0");
    }
  };

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>
        {t("settings.study.title", { defaultValue: "Study Settings" })}
      </ThemedText>
      <View style={styles.card}>
        <View style={styles.option}>
          <View style={styles.optionLeft}>
            <View
              style={[
                {
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#5856D6", // Indigo
                },
              ]}
            >
              <Ionicons name="school" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.optionText}>
              {t("settings.study.targetScore", {
                defaultValue: "Target Score",
              })}
            </ThemedText>
          </View>
          <TextInput
            style={[
              localStyles.input,
              {
                color: isDark ? "#fff" : "#000",
                backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
              },
            ]}
            keyboardType="number-pad"
            value={localValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            maxLength={3}
          />
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
    minWidth: 60,
    textAlign: "center",
  },
});
