import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../../components/themed-text";

interface ToeicHeaderProps {
  isAllSelected: boolean;
  onSelectAll: () => void;
}

export function ToeicHeader({ isAllSelected, onSelectAll }: ToeicHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <ThemedText type="subtitle" style={styles.headerTitle}>
        {t("speaking.toeic.selectParts")}
      </ThemedText>
      <TouchableOpacity onPress={onSelectAll} style={styles.selectAllBtn}>
        <ThemedText style={styles.selectAllText}>
          {isAllSelected ? t("common.deselectAll") : t("common.selectAll")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
  },
  selectAllBtn: {
    padding: 8,
  },
  selectAllText: {
    color: "#4ECDC4",
    fontSize: 14,
    fontWeight: "600",
  },
});
