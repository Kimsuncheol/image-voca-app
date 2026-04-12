import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { useColorScheme } from "../hooks/use-color-scheme";
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
import { useNotificationTapNavigation } from "../src/hooks/useNotificationTapNavigation";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { hydrateLanguage } from "../src/i18n";
import {
  fetchVocabularyCards,
  hydrateVocabularyCache,
  isVocabularyCacheFresh,
  pruneVocabularyCaches,
} from "../src/services/vocabularyPrefetch";
import { AppSplashScreen } from "../components/common/AppSplashScreen";
import { NetworkErrorOverlay } from "../components/common/NetworkErrorOverlay";
import { useSubscriptionStore } from "../src/stores";
import { CourseType, isCourseAvailableForLanguage } from "../src/types/vocabulary";

SplashScreen.preventAutoHideAsync().catch(() => {});

const BOOT_PREFETCH_DAY = 1;
const PREFETCH_TIMEOUT_MS = 1200;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isDark } = useAppTheme();
  const { user, loading, authStatus } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();

  useAuthenticatedDeviceRegistration();
  useDeviceDeletionEnforcement();
  usePushNotifications();
  useNotificationTapNavigation();

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

  // Fetch user subscription (including admin role) when user is loaded
  useEffect(() => {
    if (user && authStatus === "signed_in" && !loading) {
      useSubscriptionStore.getState().fetchSubscription(user.uid);
    } else if (!loading) {
      // Reset subscription when user logs out or is blocked on verification
      useSubscriptionStore.getState().resetSubscription();
    }
  }, [authStatus, loading, user]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isPasswordResetRoute =
      inAuthGroup && segments[1] === "reset-password";
    const isVerifyEmailRoute =
      inAuthGroup && segments[1] === "verify-email";

    if (authStatus === "signed_out") {
      if (!inAuthGroup || isVerifyEmailRoute) {
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

    if (authStatus === "signed_in" && inAuthGroup && !isPasswordResetRoute) {
      // Redirect to the home page if they are fully signed in.
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
          <NetworkErrorOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="wordbank" options={{ headerShown: false }} />
            <Stack.Screen name="course" options={{ headerShown: false }} />
            <Stack.Screen name="billing" options={{ headerShown: false }} />
            <Stack.Screen
              name="notification-card"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="advertisement-modal"
              options={{ presentation: "fullScreenModal", headerShown: false }}
            />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            <Stack.Screen
              name="profile"
              options={{ title: t("profile.title") }}
            />
            <Stack.Screen
              name="manage-devices"
              options={{ title: t("manageDevices.title") }}
            />
            <Stack.Screen
              name="calendar"
              options={{ title: t("calendar.title") }}
            />
            <Stack.Screen
              name="elementary-japanese"
              options={{
                title: t("elementaryJapanese.title", {
                  defaultValue: "Elementary Japanese",
                }),
              }}
            />
            <Stack.Screen
              name="counters"
              options={{
                title: t("counters.title", {
                  defaultValue: "Counters",
                }),
              }}
            />
            <Stack.Screen
              name="counter-category"
              options={{
                title: t("counters.title", {
                  defaultValue: "Counters",
                }),
              }}
            />
            <Stack.Screen
              name="coming-soon"
              options={{ headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="manga/reader"
              options={{ presentation: "fullScreenModal", headerShown: false }}
            />
          </Stack>
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
    if (
      hasBootstrapped.current ||
      loading ||
      !learningLanguageReady
    ) {
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

        await languagePromise;
      } catch (error) {
        console.warn("App bootstrap failed:", error);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, [learningLanguage, learningLanguageReady, loading, recentCourseByLanguage]);

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
