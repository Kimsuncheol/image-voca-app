import { getBackgroundColors } from "@/constants/backgroundColors";
import { getBorderColors } from "@/constants/borderColors";
import { getFontColors } from "@/constants/fontColors";
import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import {
  getDefaultHeaderHeight,
  HeaderHeightContext,
} from "@react-navigation/elements";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useJapaneseContentLanguageStore } from "../../stores/japaneseContentLanguageStore";
import { useLanguageSettingsStore } from "../../stores/languageSettingsStore";
import {
  changeLanguageModeWithSideEffects,
  getLanguageModeOptions,
  type LanguageModeOption,
} from "../../utils/languageModeOptions";

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  showJapaneseKoreanOption?: boolean;
}

function LanguageOptionRow({
  option,
  isSelected,
  isDark,
  styles,
  testID,
  onPress,
}: {
  option: LanguageModeOption;
  isSelected: boolean;
  isDark: boolean;
  styles: ReturnType<typeof getStyles>;
  testID: string;
  onPress: () => void;
}) {
  return (
    <Pressable testID={testID} style={styles.option} onPress={onPress}>
      <View style={styles.optionLeft}>
        {option.flag ? (
          <Text style={styles.flagText}>{option.flag}</Text>
        ) : (
          <Ionicons
            name={option.icon}
            size={22}
            color={isDark ? "#fff" : "#333"}
          />
        )}
        <Text style={styles.optionText}>{option.label}</Text>
      </View>
      {isSelected ? (
        <Ionicons
          testID={`${testID}-check`}
          name="checkmark"
          size={22}
          color="#007AFF"
        />
      ) : null}
    </Pressable>
  );
}

export function LanguageSelectionModal({
  visible,
  onClose,
  showJapaneseKoreanOption = false,
}: LanguageSelectionModalProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(isDark);
  const mode = useLanguageSettingsStore((state) => state.mode);
  const japaneseContentMode = useJapaneseContentLanguageStore(
    (state) => state.mode,
  );
  const setJapaneseContentMode = useJapaneseContentLanguageStore(
    (state) => state.setMode,
  );
  const isJapaneseContentInitialized = useJapaneseContentLanguageStore(
    (state) => state._initialized,
  );
  const hydratedJapaneseContentUserId = useJapaneseContentLanguageStore(
    (state) => state._hydratedUserId,
  );
  const hydrateJapaneseContent = useJapaneseContentLanguageStore(
    (state) => state.hydrate,
  );
  const japaneseContentUserId = user?.uid ?? null;
  const isJapaneseKoreanSelected = japaneseContentMode === "ko";
  const insets = useSafeAreaInsets();
  const headerContextHeight = React.useContext(HeaderHeightContext);
  const windowDimensions = useWindowDimensions();
  const defaultHeaderHeight = getDefaultHeaderHeight(
    windowDimensions,
    false,
    insets.top,
  );
  const headerHeight =
    typeof headerContextHeight === "number" && headerContextHeight > 0
      ? headerContextHeight
      : defaultHeaderHeight;
  const options = getLanguageModeOptions(t);
  const panelTop = Math.max(insets.top, headerHeight - 8);
  const availablePanelHeight = Math.max(
    220,
    windowDimensions.height - panelTop - 24,
  );
  const panelMaxHeight = Math.min(420, availablePanelHeight);

  const handleSelect = async (nextMode: LanguageModeOption["mode"]) => {
    try {
      await changeLanguageModeWithSideEffects(nextMode);
      onClose();
    } catch (error) {
      console.warn("Failed to change language", error);
    }
  };

  const handleSelectJapaneseKorean = async () => {
    try {
      await setJapaneseContentMode(
        japaneseContentMode === "ko" ? "default" : "ko",
        japaneseContentUserId,
      );
      onClose();
    } catch (error) {
      console.warn("Failed to change Japanese content language", error);
    }
  };

  React.useEffect(() => {
    if (
      !isJapaneseContentInitialized ||
      hydratedJapaneseContentUserId !== japaneseContentUserId
    ) {
      void hydrateJapaneseContent(japaneseContentUserId);
    }
  }, [
    hydrateJapaneseContent,
    hydratedJapaneseContentUserId,
    isJapaneseContentInitialized,
    japaneseContentUserId,
  ]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        testID="language-selection-modal-overlay"
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable
          testID="language-selection-modal-panel"
          style={[
            styles.panel,
            {
              top: panelTop,
              maxHeight: panelMaxHeight,
            },
          ]}
          onPress={(event) => event?.stopPropagation?.()}
        >
          <Text style={styles.title}>
            {t("languageModal.title", { defaultValue: "Language" })}
          </Text>

          {showJapaneseKoreanOption ? (
            <Pressable
              testID="language-selection-japanese-korean-option"
              style={[
                styles.featuredOption,
                isJapaneseKoreanSelected
                  ? styles.featuredOptionSelected
                  : styles.featuredOptionUnselected,
              ]}
              onPress={() => {
                void handleSelectJapaneseKorean();
              }}
            >
              <View style={styles.featuredTextBlock}>
                <Text style={styles.featuredTitle}>
                  {t("languageModal.learnJapaneseInKorean", {
                    defaultValue: "Learn Japanese in Korean",
                  })}
                </Text>
                <Text style={styles.featuredSubtitle}>
                  {t("languageModal.learnJapaneseInKoreanSubtitle", {
                    defaultValue: "Show Japanese course meanings in Korean.",
                  })}
                </Text>
              </View>
              {isJapaneseKoreanSelected ? (
                <Ionicons
                  testID="language-selection-japanese-korean-check"
                  name="checkmark"
                  size={22}
                  color="#007AFF"
                />
              ) : null}
            </Pressable>
          ) : null}

          <ScrollView
            style={styles.optionList}
            showsVerticalScrollIndicator={false}
          >
            <View testID="language-selection-options-card" style={styles.card}>
              {options.map((option, index) => (
                <React.Fragment key={option.mode}>
                  {index > 0 ? <View style={styles.separator} /> : null}
                  <LanguageOptionRow
                    option={option}
                    isSelected={mode === option.mode}
                    isDark={isDark}
                    styles={styles}
                    testID={`language-selection-option-${option.mode}`}
                    onPress={() => {
                      void handleSelect(option.mode);
                    }}
                  />
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const border = getBorderColors(isDark);
  const font = getFontColors(isDark);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.28)",
    },
    panel: {
      position: "absolute",
      left: 16,
      right: 16,
      alignSelf: "flex-end",
      width: "auto",
      maxWidth: 360,
      borderRadius: 22,
      borderCurve: "continuous",
      backgroundColor: bg.surfaceElevated,
      padding: 12,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border.modalPanel,
    },
    title: {
      color: font.screenTitle,
      fontSize: FontSizes.title,
      fontWeight: FontWeights.semiBold,
      textAlign: "center",
    },
    featuredOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
    },
    featuredOptionSelected: {
      borderColor: border.modalFeaturedSelected,
      backgroundColor: isDark
        ? "rgba(255,149,0,0.12)"
        : "rgba(255,149,0,0.1)",
    },
    featuredOptionUnselected: {
      borderColor: border.modalFeaturedUnselected,
      backgroundColor: "transparent",
    },
    featuredTextBlock: {
      flex: 1,
      gap: 4,
    },
    featuredTitle: {
      color: font.screenTitle,
      fontSize: FontSizes.body,
      fontWeight: FontWeights.semiBold,
    },
    featuredSubtitle: {
      color: font.screenMuted,
      fontSize: FontSizes.caption,
      lineHeight: 18,
    },
    optionList: {
      flexGrow: 0,
    },
    card: {
      borderRadius: 14,
      overflow: "hidden",
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 12,
    },
    optionLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    optionText: {
      color: font.screenTitle,
      fontSize: FontSizes.body,
      fontWeight: FontWeights.medium,
    },
    flagText: {
      width: 24,
      height: 24,
      fontSize: 22,
      lineHeight: 24,
      textAlign: "center",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.separator,
      marginLeft: 46,
    },
  });
};
