import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../themed-text";
import { TargetScorePicker } from "./TargetScorePicker";

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
  const baseOptions = [5, 10, 15, 20, 25, 30, 35, 40];
  const options = baseOptions.includes(targetScore)
    ? baseOptions
    : [...baseOptions, targetScore].sort((a, b) => a - b);

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
          <TargetScorePicker
            value={targetScore}
            options={options}
            isDark={isDark}
            onChange={onUpdateTargetScore}
          />
        </View>
      </View>
    </View>
  );
}
