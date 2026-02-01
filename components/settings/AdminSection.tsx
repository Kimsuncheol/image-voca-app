import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSubscriptionStore } from "../../src/stores/subscriptionStore";

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
  const router = useRouter();
  const isAdmin = useSubscriptionStore((state) => state.isAdmin);

  if (!isAdmin()) {
    return null;
  }

  const chevronColor = isDark ? "#8e8e93" : "#c7c7cc";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("settings.admin.title")}</Text>
      <View style={styles.card}>
        {/* Add Vocabulary */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/admin/add-voca")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={isDark ? "#fff" : "#000"}
            />
            <Text style={styles.optionText}>
              {t("settings.admin.addVocabulary")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={chevronColor} />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Member Administration */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/admin/members")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="people-outline"
              size={22}
              color={isDark ? "#fff" : "#000"}
            />
            <Text style={styles.optionText}>{t("settings.admin.members")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={chevronColor} />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Promotion Codes */}
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/admin/promotion-codes")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="gift-outline"
              size={22}
              color={isDark ? "#fff" : "#000"}
            />
            <Text style={styles.optionText}>
              {t("settings.admin.promotionCodes")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={chevronColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
