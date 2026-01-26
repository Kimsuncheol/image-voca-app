import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import ExampleSection from "./ExampleSection";
import ExplanationSection from "./ExplanationSection";
import { CollocationData } from "./types";

interface BackSideProps {
  data: CollocationData;
  isDark: boolean;
  isVisible: boolean;
}

export default function BackSide({ data, isDark, isVisible }: BackSideProps) {
  const [activeSection, setActiveSection] = useState<"explanation" | "example">(
    "explanation",
  );

  const isExplanationOpen = isVisible && activeSection === "explanation";
  const isExampleOpen = isVisible && activeSection === "example";

  return (
    <View style={[styles.back, isDark && styles.backDark]}>
      {/* Accent Brand Mark */}
      <View style={styles.accentMark} />

      <View style={styles.backContentContainer}>
        <ExplanationSection
          explanation={data.explanation}
          isOpen={isExplanationOpen}
          onToggle={() => setActiveSection("explanation")}
          isDark={isDark}
        />

        <ExampleSection
          example={data.example}
          translation={data.translation}
          isOpen={isExampleOpen}
          onToggle={() => setActiveSection("example")}
          isDark={isDark}
        />
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.indicator,
            { backgroundColor: isDark ? "#444" : "#eee" },
          ]}
        >
          <Ionicons
            name="swap-horizontal"
            size={16}
            color={isDark ? "#888" : "#aaa"}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  backDark: {
    backgroundColor: "#1c1c1e",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  accentMark: {
    position: "absolute",
    top: 32,
    right: 32,
    width: 6,
    height: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 3,
    transform: [{ rotate: "15deg" }],
  },
  backContentContainer: {
    flex: 1,
    paddingTop: 40,
    justifyContent: "flex-start",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 0,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
