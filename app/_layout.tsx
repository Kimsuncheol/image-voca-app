import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider as AppThemeProvider } from "../src/context/ThemeContext";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useColorScheme } from "../hooks/use-color-scheme";
import "../src/i18n";
import { hydrateLanguage } from "../src/i18n";
import { useTranslation } from "react-i18next";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t } = useTranslation();

  usePushNotifications();

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
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen name="profile" options={{ title: t("profile.title") }} />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useEffect(() => {
    hydrateLanguage();
  }, []);

  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </AppThemeProvider>
  );
}
