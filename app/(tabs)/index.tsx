import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DashboardCard, ProgressCard, QuickAction } from "../../components/dashboard";
import { ThemedText } from "../../components/themed-text";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
            <ThemedText type="title">{user?.email?.split("@")[0] || "Learner"}</ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActions}>
            <QuickAction
              title="Vocabulary"
              icon="book.fill"
              color="#FF6B6B"
              onPress={() => router.push("/(tabs)/swipe")}
            />
            <QuickAction
              title="Explore"
              icon="paperplane.fill"
              color="#4ECDC4"
              onPress={() => router.push("/(tabs)/explore")}
            />
            <QuickAction
              title="Quiz"
              icon="star.fill"
              color="#FFE66D"
              onPress={() => router.push("/quiz")}
            />
            <QuickAction
              title="Settings"
              icon="gearshape.fill"
              color="#95E1D3"
              onPress={() => router.push("/(tabs)/settings")}
            />
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {"Today's Progress"}
          </ThemedText>
          <ProgressCard title="Daily Goal" current={15} total={20} unit="words" />
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Stats
          </ThemedText>
          <View style={styles.statsGrid}>
            <DashboardCard
              title="Words Learned"
              value={128}
              subtitle="This week"
              icon="book.fill"
              color="#FF6B6B"
            />
            <DashboardCard
              title="Streak"
              value={7}
              subtitle="Days"
              icon="flame.fill"
              color="#FFE66D"
            />
          </View>
          <View style={[styles.statsGrid, { marginTop: 12 }]}>
            <DashboardCard
              title="Accuracy"
              value="85%"
              subtitle="Last 7 days"
              icon="checkmark.circle.fill"
              color="#4ECDC4"
            />
            <DashboardCard
              title="Time Spent"
              value="2.5h"
              subtitle="This week"
              icon="clock.fill"
              color="#95E1D3"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
});
