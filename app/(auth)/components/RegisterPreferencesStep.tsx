import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getBackgroundColors } from "../../../constants/backgroundColors";
import { getFontColors } from "../../../constants/fontColors";
import { useTheme } from "../../../src/context/ThemeContext";
import { LearningLanguage } from "../../../src/types/vocabulary";
import { PrimaryButton } from "./PrimaryButton";

interface RegisterPreferencesStepProps {
  learningLanguage: LearningLanguage | null;
  loading: boolean;
  labels: {
    wishToLearn: string;
    back: string;
    register: string;
    creatingAccount: string;
  };
  onLearningLanguageChange: (language: LearningLanguage) => void;
  onBack: () => void;
  onRegister: () => void;
}

export const RegisterPreferencesStep: React.FC<RegisterPreferencesStepProps> = ({
  learningLanguage,
  loading,
  labels,
  onLearningLanguageChange,
  onBack,
  onRegister,
}) => {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const fontColors = getFontColors(isDark);

  return (
    <>
      <View style={styles.learningSection}>
        <Text style={styles.learningSectionLabel}>{labels.wishToLearn}</Text>
        <View style={styles.learningOptionsCard}>
          {(
            [
              { lang: "en", label: "English" },
              { lang: "ja", label: "Japanese" },
            ] as const satisfies { lang: LearningLanguage; label: string }[]
          ).map(({ lang, label }, index) => (
            <React.Fragment key={lang}>
              {index > 0 && <View style={styles.learningOptionSeparator} />}
              <TouchableOpacity
                style={styles.learningOption}
                onPress={() => onLearningLanguageChange(lang)}
                activeOpacity={0.7}
              >
                <View style={styles.learningOptionLeft}>
                  <Ionicons
                    name="globe-outline"
                    size={22}
                    color={fontColors.screenBodyStrong}
                  />
                  <Text style={styles.learningOptionText}>{label}</Text>
                </View>
                {learningLanguage === lang && (
                  <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>
      <View style={styles.stepActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>{labels.back}</Text>
        </TouchableOpacity>
        <View style={styles.primaryAction}>
          <PrimaryButton
            title={labels.register}
            onPress={onRegister}
            loading={loading}
            loadingTitle={labels.creatingAccount}
            disabled={!learningLanguage}
          />
        </View>
      </View>
    </>
  );
};

const getStyles = (isDark: boolean) => {
  const bg = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    learningSection: {
      marginBottom: 16,
    },
    learningSectionLabel: {
      fontSize: FontSizes.label,
      fontWeight: FontWeights.semiBold,
      color: fontColors.sectionMeta,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    learningOptionsCard: {},
    learningOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
    },
    learningOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    learningOptionText: {
      fontSize: FontSizes.bodyLg,
      color: fontColors.body,
    },
    learningOptionSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: bg.subtleGray,
    },
    stepActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: fontColors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 18,
      minHeight: 52,
      backgroundColor: bg.cardElevated,
    },
    secondaryButtonText: {
      color: fontColors.body,
      fontSize: FontSizes.bodyLg,
      fontWeight: FontWeights.bold,
    },
    primaryAction: {
      flex: 1,
    },
  });
};
