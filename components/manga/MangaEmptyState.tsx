import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface MangaEmptyStateProps {
  isDark: boolean;
  onBack: () => void;
}

export const MangaEmptyState: React.FC<MangaEmptyStateProps> = ({
  isDark,
  onBack,
}) => {
  const { t } = useTranslation();

  const mutedText = isDark ? "#6B7280" : "#9CA3AF";
  const bodyText = isDark ? "#9CA3AF" : "#6B7280";
  const headingText = isDark ? "#F3F4F6" : "#111827";
  const iconBg = isDark ? "#1F2937" : "#F3F4F6";
  const iconColor = isDark ? "#4B5563" : "#D1D5DB";
  const borderColor = isDark ? "#374151" : "#E5E7EB";
  const backTextColor = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 500 }}
        style={[styles.iconWrap, { backgroundColor: iconBg }]}
      >
        <Ionicons name="book-outline" size={36} color={iconColor} />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 80 }}
      >
        <Text style={[styles.title, { color: headingText }]}>
          {t("manga.emptyTitle", "No Manga Available")}
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 160 }}
      >
        <Text style={[styles.subtitle, { color: bodyText }]}>
          {t("manga.emptySubtitle", "Check back later or explore other days!")}
        </Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 240 }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.button,
            { borderColor, opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={15} color={mutedText} />
          <Text style={[styles.buttonText, { color: backTextColor }]}>
            {t("common.back", "Back")}
          </Text>
        </Pressable>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
