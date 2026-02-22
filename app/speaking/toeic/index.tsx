import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToeicFooter } from "../../../src/components/speaking/toeic/ToeicFooter";
import { ToeicHeader } from "../../../src/components/speaking/toeic/ToeicHeader";
import { ToeicPartsList } from "../../../src/components/speaking/toeic/ToeicPartsList";
import { useTheme } from "../../../src/context/ThemeContext";
import { TOEIC_SPEAKING_PARTS } from "../../../src/services/aiSpeakingService";

export default function TOEICIndexScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [selectedParts, setSelectedParts] = useState<number[]>([]);

  const togglePart = (part: number) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  };

  const selectAll = () => {
    if (selectedParts.length === TOEIC_SPEAKING_PARTS.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(TOEIC_SPEAKING_PARTS.map((p) => p.part));
    }
  };

  const startPractice = () => {
    if (selectedParts.length === 0) return;

    router.push({
      pathname: "/speaking/toeic/practice",
      params: { parts: selectedParts.join(",") },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ToeicHeader
          isAllSelected={selectedParts.length === TOEIC_SPEAKING_PARTS.length}
          onSelectAll={selectAll}
        />

        {/* Parts List */}
        <ToeicPartsList
          selectedParts={selectedParts}
          onTogglePart={togglePart}
          isDark={isDark}
        />
      </ScrollView>

      {/* Start Button */}
      <ToeicFooter
        selectedPartsCount={selectedParts.length}
        onStart={startPractice}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
});
