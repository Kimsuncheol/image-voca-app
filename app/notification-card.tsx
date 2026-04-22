import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TopInstallNativeAd } from "../components/ads/TopInstallNativeAd";
import { AppSplashScreen } from "../components/common/AppSplashScreen";
import CollocationCardSection from "../components/notification/CollocationCardSection";
import EmptyState from "../components/notification/EmptyState";
import KanjiCardSection from "../components/notification/KanjiCardSection";
import NotificationHeader from "../components/notification/NotificationHeader";
import WordCard from "../components/notification/WordCard";
import type { NotificationKanjiCardPayload } from "../src/types/notificationCard";
import { useTheme } from "../src/context/ThemeContext";
import { useNotificationCard } from "../src/hooks/useNotificationCard";

export default function NotificationCardScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { payload } = useNotificationCard();
  const { t } = useTranslation();

  const [splashVisible, setSplashVisible] = React.useState(true);
  const [splashMounted, setSplashMounted] = React.useState(true);

  const handleReady = React.useCallback(() => {
    setSplashVisible(false);
  }, []);

  React.useEffect(() => {
    if (payload === null) handleReady();
  }, [payload, handleReady]);

  const handleGoDashboard = () => {
    router.replace("/(tabs)");
  };

  const title =
    payload?.cardKind === "collocation"
      ? t("notifications.collocation.header", {
          defaultValue: "Collocation Notification",
        })
      : payload?.cardKind === "kanji"
        ? t("notifications.kanji.header", {
            defaultValue: "Kanji Notification",
          })
        : t("notifications.word.header", {
            defaultValue: "Word Notification",
          });

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
        backLabel={t("tabs.dashboard", { defaultValue: "Dashboard" })}
        isDark={isDark}
        onBack={handleGoDashboard}
      />

      {splashMounted && (
        <AppSplashScreen
          visible={splashVisible}
          onHidden={() => setSplashMounted(false)}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {payload ? (
          <TopInstallNativeAd containerStyle={styles.topInstallAd} />
        ) : null}
        {/* Empty state when there is no pending notification payload */}
        {!payload ? (
          <EmptyState isDark={isDark} onGoDashboard={handleGoDashboard} />
        ) : payload.cardKind === "collocation" ? (
          /* Collocation flip-card */
          <View style={styles.cardContainer}>
            <CollocationCardSection payload={payload} isDark={isDark} onReady={handleReady} />
          </View>
        ) : payload.cardKind === "kanji" ? (
          /* Kanji flat card */
          <View style={styles.cardContainer}>
            <KanjiCardSection
              payload={payload as NotificationKanjiCardPayload}
              isDark={isDark}
              onReady={handleReady}
            />
          </View>
        ) : (
          /* Word card */
          <View style={styles.cardContainer}>
            <WordCard data={payload} isDark={isDark} onReady={handleReady} />
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
  topInstallAd: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
});
