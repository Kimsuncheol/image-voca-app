import React from "react";
import { View } from "react-native";
import { styles } from "./KanjiCollocationCardStyles";

interface DottedDividerProps {
  isDark: boolean;
  testID?: string;
}

export function DottedDivider({ isDark, testID }: DottedDividerProps) {
  return (
    <View testID={testID} style={styles.dividerWrapper}>
      <View style={[styles.dividerInner, { borderColor: isDark ? "#444" : "#ccc" }]} />
    </View>
  );
}
