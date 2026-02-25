import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CollocationCardSection from "../components/notification/CollocationCardSection";
import EmptyState from "../components/notification/EmptyState";
import NotificationHeader from "../components/notification/NotificationHeader";
import WordCard from "../components/notification/WordCard";
import { useTheme } from "../src/context/ThemeContext";
import { useNotificationCard } from "../src/hooks/useNotificationCard";

export default function NotificationCardScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { payload } = useNotificationCard();

  const handleGoDashboard = () => {
    router.replace("/(tabs)");
  };

  const title =
    payload?.cardKind === "collocation"
      ? "Collocation Notification"
      : "Word Notification";

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#000000" : "#F5F7FB" },
      ]}
      edges={["top", "bottom"]}
    >
      {/* Header: back button + card kind title */}
      <NotificationHeader
        title={title}
        isDark={isDark}
        onBack={handleGoDashboard}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state when there is no pending notification payload */}
        {!payload ? (
          <EmptyState isDark={isDark} onGoDashboard={handleGoDashboard} />
        ) : payload.cardKind === "collocation" ? (
          /* Collocation flip-card */
          <View style={styles.cardContainer}>
            <CollocationCardSection payload={payload} isDark={isDark} />
          </View>
        ) : (
          /* Word card */
          <View style={styles.cardContainer}>
            <WordCard data={payload} isDark={isDark} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
});
