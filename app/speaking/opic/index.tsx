import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OpicFooter } from "../../../src/components/speaking/opic/OpicFooter";
import { OpicTargetLevel } from "../../../src/components/speaking/opic/OpicTargetLevel";
import { OpicTopicsList } from "../../../src/components/speaking/opic/OpicTopicsList";
import { useTheme } from "../../../src/context/ThemeContext";
import { OPIcLevel } from "../../../src/services/aiSpeakingService";

export default function OPIcIndexScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [targetLevel, setTargetLevel] = useState<OPIcLevel>("IM2");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  };

  const startPractice = () => {
    if (selectedTopics.length === 0) return;

    router.push({
      pathname: "/speaking/opic/practice",
      params: {
        level: targetLevel,
        topics: selectedTopics.join(","),
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Target Level Section */}
        <OpicTargetLevel
          targetLevel={targetLevel}
          onSelectLevel={setTargetLevel}
          isDark={isDark}
        />

        {/* Topic Selection */}
        <OpicTopicsList
          selectedTopics={selectedTopics}
          onToggleTopic={toggleTopic}
          isDark={isDark}
        />
      </ScrollView>

      {/* Start Button */}
      <OpicFooter
        selectedTopicsCount={selectedTopics.length}
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
