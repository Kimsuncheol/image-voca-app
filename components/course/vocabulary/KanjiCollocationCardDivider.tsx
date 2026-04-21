import React from "react";
import { View } from "react-native";
import { styles } from "./KanjiCollocationCardStyles";

export function DottedDivider({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.dividerWrapper}>
      <View style={[styles.dividerInner, { borderColor: isDark ? "#444" : "#ccc" }]} />
    </View>
  );
}
