import React from "react";
import { useTranslation } from "react-i18next";
import { FontSizes } from "@/constants/fontSizes";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";

interface StreakMilestoneModalProps {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export function StreakMilestoneModal({
  visible,
  streak,
  onClose,
}: StreakMilestoneModalProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
          ]}
        >
          <Text style={styles.flame}>🔥</Text>
          <Text
            style={[styles.title, { color: isDark ? "#fff" : "#000" }]}
          >
            {t("streak.milestone.title", { streak })}
          </Text>
          <Text
            style={[styles.message, { color: isDark ? "#aaa" : "#555" }]}
          >
            {t("streak.milestone.message", { streak })}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {t("streak.milestone.cta")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  flame: {
    fontSize: FontSizes.displayHuge,
  },
  title: {
    fontSize: FontSizes.heading,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: FontSizes.bodyMd,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#FF9500",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: FontSizes.bodyLg,
    fontWeight: "700",
  },
});
