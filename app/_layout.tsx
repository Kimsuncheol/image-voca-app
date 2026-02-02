import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "../hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider as AppThemeProvider } from "../src/context/ThemeContext";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import "../src/i18n";
import { hydrateLanguage } from "../src/i18n";
import { db } from "../src/services/firebase";
import {
  fetchVocabularyCards,
  hydrateVocabularyCache,
  isVocabularyCacheFresh,
} from "../src/services/vocabularyPrefetch";
import { useSubscriptionStore } from "../src/stores/subscriptionStore";
import { CourseType } from "../src/types/vocabulary";

SplashScreen.preventAutoHideAsync().catch(() => {});

const RECENT_COURSE_KEY = "recentCourse";
const BOOT_PREFETCH_DAY = 1;
const PREFETCH_TIMEOUT_MS = 1200;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchSubscription, resetSubscription } = useSubscriptionStore();

  usePushNotifications();

  // Fetch user subscription (including admin role) when user is loaded
  useEffect(() => {
    if (user && !loading) {
      fetchSubscription(user.uid);
    } else if (!user && !loading) {
      // Reset subscription when user logs out
      resetSubscription();
    }
  }, [user, loading, fetchSubscription, resetSubscription]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to the login page if they are not logged in.
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to the home page if they are logged in.
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="wordbank" options={{ headerShown: false }} />
          <Stack.Screen name="course" options={{ headerShown: false }} />
          <Stack.Screen name="review" options={{ headerShown: false }} />
          <Stack.Screen name="billing" options={{ headerShown: false }} />
          <Stack.Screen
            name="advertisement-modal"
            options={{ presentation: "fullScreenModal", headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="profile"
            options={{ title: t("profile.title") }}
          />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current || loading) {
      return;
    }

    hasBootstrapped.current = true;

    const prepare = async () => {
      try {
        const languagePromise = hydrateLanguage();

        let recentCourse = await AsyncStorage.getItem(RECENT_COURSE_KEY);
        if (recentCourse) {
          const cached = await hydrateVocabularyCache(
            recentCourse as CourseType,
            BOOT_PREFETCH_DAY,
            { allowStale: true },
          );

          const isFresh = isVocabularyCacheFresh(
            recentCourse as CourseType,
            BOOT_PREFETCH_DAY,
          );

          if (!cached || cached.length === 0 || !isFresh) {
            const refreshPromise = fetchVocabularyCards(
              recentCourse as CourseType,
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
        } else if (user) {
          void getDoc(doc(db, "users", user.uid))
            .then((userDoc) => {
              if (!userDoc.exists()) return null;
              const data = userDoc.data();
              return typeof data.recentCourse === "string"
                ? (data.recentCourse as CourseType)
                : null;
            })
            .then((courseId) => {
              if (courseId) {
                return fetchVocabularyCards(courseId, BOOT_PREFETCH_DAY);
              }
              return null;
            })
            .catch((error) => {
              console.warn("Recent course prefetch failed:", error);
            });
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
  }, [loading, user]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <AppBootstrap>
          <RootLayoutNav />
        </AppBootstrap>
      </AuthProvider>
    </AppThemeProvider>
  );
}
