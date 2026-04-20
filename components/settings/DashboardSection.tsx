import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { ToggleSwitch } from "../common/ToggleSwitch";
import { useDashboardSettingsStore } from "../../src/stores/dashboardSettingsStore";

interface DashboardSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  t: (key: string, options?: any) => string;
}

export function DashboardSection({ styles, t }: DashboardSectionProps) {
  const { famousQuoteEnabled, setFamousQuoteEnabled } = useDashboardSettingsStore();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("settings.dashboard.title", { defaultValue: "Dashboard" })}
      </Text>
      <View style={styles.card}>
        <View style={styles.option}>
          <View style={styles.optionLeft}>
            <View style={[iconStyles.circle, { backgroundColor: "#FF950020" }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FF9500" />
            </View>
            <Text style={styles.optionText}>
              {t("settings.dashboard.famousQuote", {
                defaultValue: "Famous Quote",
              })}
            </Text>
          </View>
          <ToggleSwitch
            value={famousQuoteEnabled}
            onValueChange={setFamousQuoteEnabled}
          />
        </View>
      </View>
    </View>
  );
}

const iconStyles = {
  circle: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 8,
  },
};
