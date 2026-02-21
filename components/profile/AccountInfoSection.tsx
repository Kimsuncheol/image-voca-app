import React from "react";
import { Text, TextInput, View } from "react-native";

interface AccountInfoSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  displayName: string;
  onChangeDisplayName: (value: string) => void;
  email?: string | null;
  role?: string;
  t: (key: string) => string;
}

export function AccountInfoSection({
  styles,
  isDark,
  displayName,
  onChangeDisplayName,
  email,
  role,
  t,
}: AccountInfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t("profile.sections.accountInfo")}
      </Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("profile.fields.name")}</Text>
          <TextInput
            style={styles.infoValueInput}
            value={displayName}
            onChangeText={onChangeDisplayName}
            placeholder={t("profile.fields.displayNamePlaceholder")}
            placeholderTextColor={isDark ? "#555" : "#999"}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t("profile.fields.email")}</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
        {role && (
          <>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.fields.role")}</Text>
              <Text style={styles.infoValue}>
                {role.includes("admin") ? "Admin" : "Student"}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
