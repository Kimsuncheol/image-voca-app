import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ToggleSwitch } from "../common/ToggleSwitch";
import { DashboardLayoutModal } from "./DashboardLayoutModal";
import { useDashboardSettingsStore } from "../../src/stores/dashboardSettingsStore";

interface DashboardSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  t: (key: string, options?: any) => string;
}

export function DashboardSection({ styles, isDark, t }: DashboardSectionProps) {
  const { quizEnabled, famousQuoteEnabled, setQuizEnabled, setFamousQuoteEnabled } =
    useDashboardSettingsStore();
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("settings.dashboard.title", { defaultValue: "Dashboard" })}
        </Text>
        <View style={styles.card}>
          {/* Pop Quiz toggle */}
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <View style={[iconStyles.circle, { backgroundColor: "#5856D620" }]}>
                <Ionicons name="help-circle" size={20} color="#5856D6" />
              </View>
              <Text style={styles.optionText}>
                {t("settings.dashboard.popQuiz", { defaultValue: "Pop Quiz" })}
              </Text>
            </View>
            <ToggleSwitch value={quizEnabled} onValueChange={setQuizEnabled} />
          </View>

          <View style={styles.separator} />

          {/* Famous Quote toggle */}
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <View style={[iconStyles.circle, { backgroundColor: "#FF950020" }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#FF9500" />
              </View>
              <Text style={styles.optionText}>
                {t("settings.dashboard.famousQuote", { defaultValue: "Famous Quote" })}
              </Text>
            </View>
            <ToggleSwitch value={famousQuoteEnabled} onValueChange={setFamousQuoteEnabled} />
          </View>

          <View style={styles.separator} />

          {/* Layout order */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => setShowLayoutModal(true)}
          >
            <View style={styles.optionLeft}>
              <View style={[iconStyles.circle, { backgroundColor: "#34C75920" }]}>
                <Ionicons name="reorder-three" size={20} color="#34C759" />
              </View>
              <Text style={styles.optionText}>
                {t("settings.dashboard.layout", { defaultValue: "Layout" })}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? "#636366" : "#c7c7cc"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <DashboardLayoutModal
        visible={showLayoutModal}
        onClose={() => setShowLayoutModal(false)}
        isDark={isDark}
      />
    </>
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
