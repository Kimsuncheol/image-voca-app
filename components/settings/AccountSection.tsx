import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AccountSectionProps {
  styles: Record<string, any>;
  isDark: boolean;
  t: (key: string) => string;
}

export function AccountSection({ styles, isDark, t }: AccountSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.account.title")}</Text>
      <View style={styles.card}>
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons
                name="person-outline"
                size={24}
                color={isDark ? "#fff" : "#333"}
              />
              <Text style={styles.optionText}>
                {t("settings.account.profile")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#666" : "#c7c7cc"}
            />
          </TouchableOpacity>
        </Link>
        <View style={styles.separator} />
        <Link href="/billing" asChild>
          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons
                name="card-outline"
                size={24}
                color={isDark ? "#fff" : "#333"}
              />
              <Text style={styles.optionText}>
                {t("settings.account.billing")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? "#666" : "#c7c7cc"}
            />
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
