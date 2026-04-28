import React from "react";
import { View } from "react-native";
import { styles } from "./KanjiCollocationCardStyles";
import { blackCardColors } from "./blackCardStyles";

interface DottedDividerProps {
  isDark: boolean;
  testID?: string;
}

export function DottedDivider({ isDark: _isDark, testID }: DottedDividerProps) {
  return (
    <View testID={testID} style={styles.dividerWrapper}>
      <View style={[styles.dividerInner, { borderColor: blackCardColors.dividerMuted }]} />
    </View>
  );
}
