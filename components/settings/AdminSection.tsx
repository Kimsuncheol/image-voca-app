import React from "react";
import { Text, View } from "react-native";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";
import { AddVocabularyRow } from "./admin/features/AddVocabularyRow";

interface AdminSectionProps {
  styles: any;
  t: (key: string) => string;
  isDark?: boolean;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  styles,
  t,
  isDark = false,
}) => {
  const isAdmin = useSubscriptionStore((state) => state.isAdmin);

  if (!isAdmin()) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.admin.title")}</Text>
      <View style={styles.card}>
        <AddVocabularyRow styles={styles} isDark={isDark} t={t} />
      </View>
    </View>
  );
};
