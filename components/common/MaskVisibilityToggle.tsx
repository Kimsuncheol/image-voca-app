import { FontSizes } from "@/constants/fontSizes";
import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { getFontColors } from "../../constants/fontColors";

interface MaskVisibilityToggleProps {
  isDark: boolean;
  isMaskEnabled: boolean;
  onMaskChange?: (enabled: boolean) => void;
  testID: string;
  stopPropagation?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function MaskVisibilityToggle({
  isDark,
  isMaskEnabled,
  onMaskChange = () => {},
  testID,
  stopPropagation = false,
  style,
}: MaskVisibilityToggleProps) {
  const { t } = useTranslation();
  const bgColors = getBackgroundColors(isDark);
  const fontColors = getFontColors(isDark);

  const handlePress = React.useCallback(
    (event: { stopPropagation?: () => void } | undefined, enabled: boolean) => {
      if (stopPropagation) {
        event?.stopPropagation?.();
      }
      onMaskChange(enabled);
    },
    [onMaskChange, stopPropagation],
  );

  return (
    <View
      testID={testID}
      style={[
        styles.group,
        {
          backgroundColor: bgColors.learningCardSurfaceAlt,
          borderColor: fontColors.learningCardDividerMuted,
        },
        style,
      ]}
    >
      {([true, false] as const).map((enabled) => {
        const isSelected = isMaskEnabled === enabled;
        const labelKey = enabled ? "course.mask" : "course.show";
        const defaultValue = enabled ? "Mask" : "Show";

        return (
          <TouchableOpacity
            key={labelKey}
            testID={`${testID}-${enabled ? "mask" : "show"}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            activeOpacity={0.78}
            onPress={(event) => handlePress(event, enabled)}
            style={[
              styles.segment,
              {
                backgroundColor: isSelected
                  ? bgColors.learningCardSurface
                  : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: isSelected
                    ? fontColors.learningCardPrimary
                    : fontColors.learningCardMuted,
                },
              ]}
            >
              {t(labelKey, { defaultValue })}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
  },
  segment: {
    minHeight: 30,
    minWidth: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  text: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.bold,
  },
});
