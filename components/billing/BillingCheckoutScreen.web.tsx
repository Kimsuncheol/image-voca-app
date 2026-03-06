import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../../components/themed-text";
import { useTheme } from "../../src/context/ThemeContext";

export default function BillingCheckoutScreenWeb() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen
        options={{
          title: t("billing.checkout.title"),
          headerBackTitle: t("common.back"),
        }}
      />
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {t("billing.checkout.title")}
        </ThemedText>
        <ThemedText style={styles.message}>
          {planId
            ? t("billing.checkout.webUnsupported", {
                defaultValue:
                  "Web checkout is not available in this build. Please continue on iOS or Android.",
              })
            : t("billing.checkout.invalidPlan")}
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.button}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>
            {t("common.back")}
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    opacity: 0.72,
    lineHeight: 22,
  },
  button: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
