import { getBackgroundColors } from "@/constants/backgroundColors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import * as Localization from "expo-localization";
import {
  Stack,
  useGlobalSearchParams,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { AppSplashScreen } from "../components/common/AppSplashScreen";
import { NetworkErrorOverlay } from "../components/common/NetworkErrorOverlay";
import { useColorScheme } from "../hooks/use-color-scheme";
import { EyeComfortOverlay } from "../src/components/common/EyeComfortOverlay";
import { EyeComfortHeaderButton } from "../src/components/common/EyeComfortHeaderButton";
import { LanguageHeaderButton } from "../src/components/common/LanguageHeaderButton";
import { MaskHeaderButton } from "../src/components/common/MaskHeaderButton";
import { ReadingDisplayModal } from "../src/components/common/ReadingDisplayModal";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import {
  LearningLanguageProvider,
  RECENT_COURSE_STORAGE_KEY,
  useLearningLanguage,
} from "../src/context/LearningLanguageContext";
import {
  ThemeProvider as AppThemeProvider,
  useTheme as useAppTheme,
} from "../src/context/ThemeContext";
import { useAuthenticatedDeviceRegistration } from "../src/hooks/useAuthenticatedDeviceRegistration";
import { useDeviceDeletionEnforcement } from "../src/hooks/useDeviceDeletionEnforcement";
import { useLockScreenVocabularyNotificationRouting } from "../src/hooks/useLockScreenVocabularyNotificationRouting";
import { useLockScreenVocabularySync } from "../src/hooks/useLockScreenVocabularySync";
import { useStudyReminderNotifications } from "../src/hooks/useStudyReminderNotifications";
import { useSpeechPreferences } from "../src/hooks/useSpeechPreferences";
import { hydrateLanguage, syncLanguageWithSystemLocales } from "../src/i18n";
import { initializeMobileAds } from "../src/services/mobileAds";
import {
  fetchVocabularyCards,
  hydrateVocabularyCache,
  isVocabularyCacheFresh,
  pruneVocabularyCaches,
} from "../src/services/vocabularyPrefetch";
import { useReadingDisplayStore } from "../src/stores/readingDisplayStore";
import {
  CourseType,
  isCourseAvailableForLanguage,
  isJlptLevelCourseId,
} from "../src/types/vocabulary";

SplashScreen.preventAutoHideAsync().catch(() => {});

const BOOT_PREFETCH_DAY = 1;
const PREFETCH_TIMEOUT_MS = 1200;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function LanguageSettingsSync() {
  const locales = Localization.useLocales();
  const localeSignature = locales
    .map(
      (locale) =>
        `${locale.languageTag}:${locale.languageCode}:${locale.regionCode}`,
    )
    .join("|");

  useEffect(() => {
    void syncLanguageWithSystemLocales(locales);
  }, [localeSignature, locales]);

  return null;
}

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function CoursesHeaderActions() {
  const params = useGlobalSearchParams<{ course?: string | string[] }>();
  const segments = useSegments();
  const { vocabularyPreferences } = useSpeechPreferences();
  const course = getParamValue(params.course);
  const isJlptLevelSelectionRoute =
    segments[0] === "courses" && segments[1] === "jlpt-levels";
  const hideMaskButton =
    (course === "KANJI" &&
      vocabularyPreferences.reviewMaskTarget === "synonym") ||
    (isJlptLevelCourseId(course) &&
      vocabularyPreferences.reviewMaskTarget === "reading");

  if (isJlptLevelSelectionRoute) {
    return null;
  }

  return (
    <View style={styles.coursesHeaderActions}>
      <MaskHeaderButton courseId={course} hidden={hideMaskButton} />
      <LanguageHeaderButton showJapaneseKoreanOption />
      <EyeComfortHeaderButton />
    </View>
  );
}

const isReadingBrightnessRoute = (segments: string[]) =>
  (segments[0] === "course" &&
    (segments[2] === "vocabulary" || segments[2] === "quiz-play")) ||
  segments[0] === "courses";

export function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const { user, loading, authStatus } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();
  const bgColors = getBackgroundColors(isDark);
  const setBrightnessScopeActive = useReadingDisplayStore(
    (state) => state.setBrightnessScopeActive,
  );

  useAuthenticatedDeviceRegistration();
  useDeviceDeletionEnforcement();
  useLockScreenVocabularyNotificationRouting();
  useLockScreenVocabularySync();
  useStudyReminderNotifications();

  useEffect(() => {
    setBrightnessScopeActive(isReadingBrightnessRoute(segments));
  }, [segments, setBrightnessScopeActive]);

  const paperTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: "#4A90E2",
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: "#4A90E2",
        },
      };


  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isPasswordResetRoute =
      (inAuthGroup && segments[1] === "reset-password") ||
      segments[0] === "reset-password";
    const isVerifyEmailRoute = inAuthGroup && segments[1] === "verify-email";
    const isAccountDeletedRoute =
      inAuthGroup && segments[1] === "account-deleted";

    if (authStatus === "signed_out") {
      if ((!inAuthGroup && !isPasswordResetRoute) || isVerifyEmailRoute) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (authStatus === "pending_verification") {
      if (!isVerifyEmailRoute && !isPasswordResetRoute) {
        router.replace("/(auth)/verify-email");
      }
      return;
    }

    if (
      authStatus === "signed_in" &&
      inAuthGroup &&
      !isPasswordResetRoute &&
      !isAccountDeletedRoute
    ) {
      router.replace("/(tabs)");
    } else if (!user && !inAuthGroup) {
      // Redirect to the login page if they are not logged in.
      router.replace("/(auth)/login");
    }
  }, [authStatus, loading, router, segments, user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <NavigationThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <LanguageSettingsSync />
          <NetworkErrorOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="wordbank" options={{ headerShown: false }} />
            <Stack.Screen
              name="courses"
              options={{
                headerRight: () => <CoursesHeaderActions />,
                headerStyle: { backgroundColor: bgColors.screen },
                headerTintColor: isDark ? "#fff" : "#000",
              }}
            />
            <Stack.Screen name="course" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="profile"
              options={{ 
                title: t("profile.title"),
                headerStyle: {backgroundColor: bgColors.screen}
               }}
            />
            <Stack.Screen
              name="delete-account-before-you-leave"
              options={{
                title: t("profile.deleteFlow.beforeTitle"),
                headerShown: false,
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="delete-account-confirm-password"
              options={{
                title: t("profile.deleteFlow.confirmTitle"),
                headerShown: false,
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="manage-devices"
              options={{ 
                title: t("manageDevices.title"),
                headerStyle: {backgroundColor: bgColors.screen}
               }}
            />
            <Stack.Screen
              name="settings-language"
              options={{
                title: t("settings.language.title"),
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="settings-learning-language"
              options={{
                title: t("settings.language.learningLanguage"),
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="settings-speech-speed"
              options={{
                title: t("settings.speech.speed"),
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="settings-review-mask-target"
              options={{
                title: t("settings.speech.reviewMaskTarget"),
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="settings/eye-comfort-intensity"
              options={{
                title: t("settings.eyeComfort.intensityTitle", {
                  defaultValue: "Eye Comfort Intensity",
                }),
                headerStyle: { backgroundColor: bgColors.screenAlt },
              }}
            />
            <Stack.Screen
              name="calendar"
              options={{ 
                title: t("calendar.title"),
                headerStyle: {backgroundColor: bgColors.screen}
               }}
            />
            <Stack.Screen
              name="elementary-japanese"
              options={{
                title: t("elementaryJapanese.title", {
                  defaultValue: "Elementary Japanese",
                }),
                headerStyle: {backgroundColor: bgColors.screen}
              }}
            />
            <Stack.Screen
              name="counters"
              options={{
                title: t("counters.title", {
                  defaultValue: "Counters",
                }),
                headerStyle: {backgroundColor: bgColors.screen}
              }}
            />
            <Stack.Screen
              name="japanese-greetings"
              options={{
                title: t("greetings.title", {
                  defaultValue: "Greetings",
                }),
                headerStyle: {backgroundColor: bgColors.screen}
              }}
            />
            <Stack.Screen
              name="counter-category"
              options={{
                title: t("counters.title", {
                  defaultValue: "Counters",
                }),
                headerStyle: {backgroundColor: bgColors.screen}
              }}
            />
            <Stack.Screen
              name="coming-soon"
              options={{ headerBackTitle: "Back" }}
            />

          </Stack>
          <ReadingDisplayModal />
          <EyeComfortOverlay />
          <StatusBar style={isDark ? "light" : "dark"} />
        </NavigationThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const {
    isReady: learningLanguageReady,
    learningLanguage,
    recentCourseByLanguage,
  } = useLearningLanguage();
  const [ready, setReady] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current || loading || !learningLanguageReady) {
      return;
    }

    hasBootstrapped.current = true;

    const prepare = async () => {
      try {
        void pruneVocabularyCaches();
        const languagePromise = hydrateLanguage();

        const legacyRecentCourse = (await AsyncStorage.getItem(
          RECENT_COURSE_STORAGE_KEY,
        )) as CourseType | null;
        const recentCourse =
          recentCourseByLanguage[learningLanguage] ??
          (legacyRecentCourse &&
          isCourseAvailableForLanguage(legacyRecentCourse, learningLanguage)
            ? legacyRecentCourse
            : null);

        if (recentCourse) {
          const cached = await hydrateVocabularyCache(
            recentCourse,
            BOOT_PREFETCH_DAY,
            { allowStale: true },
          );

          const isFresh = isVocabularyCacheFresh(
            recentCourse,
            BOOT_PREFETCH_DAY,
          );

          if (!cached || cached.length === 0 || !isFresh) {
            const refreshPromise = fetchVocabularyCards(
              recentCourse,
              BOOT_PREFETCH_DAY,
            ).catch((error) => {
              console.warn("Vocabulary prefetch failed:", error);
              return [];
            });

            if (!cached || cached.length === 0) {
              await Promise.race([refreshPromise, sleep(PREFETCH_TIMEOUT_MS)]);
            } else {
              void refreshPromise;
            }
          }
        }

        await initializeMobileAds();
        await languagePromise;
      } catch (error) {
        console.warn("App bootstrap failed:", error);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [
    learningLanguage,
    learningLanguageReady,
    loading,
    recentCourseByLanguage,
  ]);

  return (
    <>
      {ready && children}
      {!splashHidden && (
        <AppSplashScreen
          visible={!ready}
          onHidden={() => setSplashHidden(true)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  coursesHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <LearningLanguageProvider>
          <AppBootstrap>
            <RootLayoutNav />
          </AppBootstrap>
        </LearningLanguageProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
