import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const LEARNING_LANGUAGES_KEY = "@learningLanguages";

interface Props {
  styles: Record<string, any>;
  isDark: boolean;
}

export function LearningLanguageSection({ styles, isDark }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(["en"]);

  useEffect(() => {
    AsyncStorage.getItem(LEARNING_LANGUAGES_KEY).then((value) => {
      if (value) setSelected(JSON.parse(value));
    });
  }, []);

  const toggleEnglish = async () => {
    const next = selected.includes("en")
      ? selected.filter((l) => l !== "en")
      : [...selected, "en"];
    setSelected(next);
    await AsyncStorage.setItem(LEARNING_LANGUAGES_KEY, JSON.stringify(next));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>The language you wish to learn</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.option} onPress={toggleEnglish}>
          <View style={styles.optionLeft}>
            <Ionicons
              name="globe-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>English</Text>
          </View>
          {selected.includes("en") && (
            <Ionicons name="checkmark" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/coming-soon")}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="globe-outline"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
            <Text style={styles.optionText}>Japanese</Text>
          </View>
          <View style={localStyles.rightRow}>
            {selected.includes("ja") && (
              <Ionicons name="checkmark" size={24} color="#007AFF" />
            )}
            <View
              style={[
                localStyles.badge,
                { backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" },
              ]}
            >
              <Text
                style={[
                  localStyles.badgeText,
                  { color: isDark ? "#8e8e93" : "#6e6e73" },
                ]}
              >
                Coming Soon
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? "#8e8e93" : "#c7c7cc"}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
