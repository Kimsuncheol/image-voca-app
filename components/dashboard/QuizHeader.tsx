/**
 * ====================================
 * QUIZ HEADER COMPONENT
 * ====================================
 *
 * Displays the pop quiz title, subtitle, and timer.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { QuizTimer } from "../course/QuizTimer";
import { ThemedText } from "../themed-text";

interface QuizHeaderProps {
  title: string;
  subtitle: string;
  timerDuration: number;
  isTimerRunning: boolean;
  quizKey: string;
  onTimeUp: () => void;
}

export function QuizHeader({
  title,
  subtitle,
  timerDuration,
  isTimerRunning,
  quizKey,
  onTimeUp,
}: QuizHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>
      </View>
      <QuizTimer
        duration={timerDuration}
        onTimeUp={onTimeUp}
        isRunning={isTimerRunning}
        quizKey={quizKey}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
