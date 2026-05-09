import { FontSizes } from "@/constants/fontSizes";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { LanguageSelectionModal } from "./LanguageSelectionModal";

interface LanguageHeaderButtonProps {
  showJapaneseKoreanOption?: boolean;
  testID?: string;
}

export function LanguageHeaderButton({
  showJapaneseKoreanOption = false,
  testID = "language-header-button",
}: LanguageHeaderButtonProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const iconColor = isDark ? "#f2f2f7" : "#111827";

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={t("languageModal.headerButtonLabel", {
          defaultValue: "Language options",
        })}
        style={styles.button}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons
          name="language-outline"
          size={FontSizes.bodyLg}
          color={iconColor}
        />
      </Pressable>
      <LanguageSelectionModal
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        showJapaneseKoreanOption={showJapaneseKoreanOption}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
