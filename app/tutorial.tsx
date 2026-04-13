import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../components/themed-text";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { markTutorialCompleted } from "../src/services/userProfileService";
import { useTutorialStore } from "../src/stores/tutorialStore";

type TutorialSlide = {
  key:
    | "dashboard"
    | "days"
    | "vocabulary"
    | "wordBank"
    | "calendar"
    | "elementaryJapanese";
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

const SLIDES: TutorialSlide[] = [
  { key: "dashboard", icon: "grid-outline", accent: "#2563EB" },
  { key: "days", icon: "apps-outline", accent: "#0F766E" },
  { key: "vocabulary", icon: "albums-outline", accent: "#7C3AED" },
  { key: "wordBank", icon: "folder-open-outline", accent: "#EA580C" },
  { key: "calendar", icon: "calendar-outline", accent: "#DC2626" },
  { key: "elementaryJapanese", icon: "language-outline", accent: "#0891B2" },
];

export default function TutorialScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setTutorialStatus } = useTutorialStore();
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);

  const currentSlide = SLIDES[index];
  const isLastSlide = index === SLIDES.length - 1;

  const completeTutorial = React.useCallback(async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      if (user?.uid) {
        await markTutorialCompleted(user.uid);
      }
      setTutorialStatus("completed");
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to complete tutorial:", error);
      setTutorialStatus("completed");
      router.replace("/(tabs)");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, router, setTutorialStatus, user?.uid]);

  const handleNext = React.useCallback(() => {
    if (isLastSlide) {
      void completeTutorial();
      return;
    }
    setIndex((current) => current + 1);
  }, [completeTutorial, isLastSlide]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#000000" : "#F7F8FC" },
      ]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.shell}>
        <View style={styles.topBar}>
          <ThemedText style={styles.progressText}>
            {`${index + 1} / ${SLIDES.length}`}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              void completeTutorial();
            }}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <ThemedText
              style={[
                styles.skipText,
                { color: isDark ? "#93C5FD" : "#2563EB" },
              ]}
            >
              {t("tutorial.skip", { defaultValue: "Skip" })}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.heroCard,
              { backgroundColor: isDark ? "#111318" : "#FFFFFF" },
            ]}
          >
            <View
              style={[
                styles.iconShell,
                {
                  backgroundColor: `${currentSlide.accent}18`,
                  borderColor: `${currentSlide.accent}22`,
                },
              ]}
            >
              <Ionicons
                name={currentSlide.icon}
                size={36}
                color={currentSlide.accent}
              />
            </View>

            <View style={styles.heroText}>
              <ThemedText style={styles.kicker}>
                {t("tutorial.title", { defaultValue: "Tutorial" })}
              </ThemedText>
              <ThemedText type="title">
                {t(`tutorial.slides.${currentSlide.key}.title`)}
              </ThemedText>
              <ThemedText
                style={[
                  styles.body,
                  { color: isDark ? "rgba(255,255,255,0.72)" : "#4B5563" },
                ]}
              >
                {t(`tutorial.slides.${currentSlide.key}.body`)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.dotsRow}>
            {SLIDES.map((slide, slideIndex) => (
              <View
                key={slide.key}
                style={[
                  styles.dot,
                  slideIndex === index
                    ? { backgroundColor: currentSlide.accent, width: 28 }
                    : {
                        backgroundColor: isDark ? "#2A2F37" : "#D6D9E0",
                        width: 10,
                      },
                ]}
              />
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: currentSlide.accent,
              opacity: isSaving ? 0.7 : 1,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <ThemedText style={styles.primaryButtonText}>
            {t(
              isLastSlide ? "tutorial.getStarted" : "tutorial.next",
              { defaultValue: isLastSlide ? "Get Started" : "Next" },
            )}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shell: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.58,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    gap: 24,
  },
  iconShell: {
    width: 78,
    height: 78,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroText: {
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    opacity: 0.55,
    textTransform: "uppercase",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 10,
    borderRadius: 999,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
