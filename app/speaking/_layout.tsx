import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";

export default function SpeakingLayout() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? "#000" : "#fff",
        },
        headerTintColor: isDark ? "#fff" : "#000",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("speaking.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <Stack.Screen
        name="toeic/index"
        options={{
          title: t("speaking.toeic.title"),
          headerTitle: "TOEIC Speaking",
          headerBackTitle: t("common.back"),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="toeic/practice"
        options={{
          title: t("speaking.toeic.practice"),
          headerBackTitle: t("common.back"),
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="toeic/results"
        options={{
          title: t("speaking.toeic.results"),
          headerBackTitle: t("common.back"),
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="opic/index"
        options={{
          title: t("speaking.opic.title"),
          headerTitle: "OPIc",
          headerBackTitle: t("common.back"),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="opic/practice"
        options={{
          title: t("speaking.opic.practice"),
          headerBackTitle: t("common.back"),
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="opic/results"
        options={{
          title: t("speaking.opic.results"),
          headerBackTitle: t("common.back"),
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
