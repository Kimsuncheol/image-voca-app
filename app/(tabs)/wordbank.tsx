import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { WordBankCourseGrid, WordBankHeader } from "../../components/wordbank";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useTimeTracking } from "../../src/hooks/useTimeTracking";
import { useSubscriptionStore } from "../../src/stores";
import { CourseType } from "../../src/types/vocabulary";

export default function WordBankScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { fetchSubscription } = useSubscriptionStore();
  useTimeTracking(); // Track time spent on this screen

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchSubscription(user.uid);
      }
    }, [fetchSubscription, user])
  );

  const handleCoursePress = (courseId: CourseType) => {
    router.push({
      pathname: "/courses/[course]",
      params: { course: courseId },
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WordBankHeader />
        <WordBankCourseGrid onCoursePress={handleCoursePress} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
