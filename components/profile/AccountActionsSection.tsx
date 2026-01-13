import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AccountActionsSectionProps {
  styles: Record<string, any>;
  loading: boolean;
  onDeleteAccount: () => void;
  t: (key: string) => string;
}

export function AccountActionsSection({
  styles,
  loading,
  onDeleteAccount,
  t,
}: AccountActionsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("profile.sections.accountActions")}
      </Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.dangerOption}
          onPress={onDeleteAccount}
          disabled={loading}
        >
          <Text style={styles.dangerText}>
            {loading ? t("profile.delete.processing") : t("profile.delete.title")}
          </Text>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
