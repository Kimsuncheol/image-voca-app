import React from "react";
import { View } from "react-native";
import { getFontColors } from "../../../constants/fontColors";
import { styles } from "./KanjiCollocationCardStyles";

interface DottedDividerProps {
  isDark: boolean;
  testID?: string;
}

export function DottedDivider({ isDark, testID }: DottedDividerProps) {
  const fontColors = getFontColors(isDark);

  return (
    <View testID={testID} style={styles.dividerWrapper}>
      <View
        style={[
          styles.dividerInner,
          { borderColor: fontColors.learningCardDividerMuted },
        ]}
      />
    </View>
  );
}
