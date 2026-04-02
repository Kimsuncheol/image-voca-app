import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext";

interface MangaReaderControlsProps {
  currentPage: number;
  totalPages: number;
  onBack: () => void;
  visible: boolean;
}

export function MangaReaderControls({
  currentPage,
  totalPages,
  onBack,
  visible,
}: MangaReaderControlsProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const barBg = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)";
  const textColor = isDark ? "#fff" : "#000";

  if (!visible) {
    return null;
  }

  return (
    <>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, backgroundColor: barBg },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.button}>
          <Text style={[styles.buttonText, { color: textColor }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 8, backgroundColor: barBg },
        ]}
      >
        <Text style={[styles.pageCounter, { color: textColor }]}>
          {currentPage + 1} / {totalPages}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 12,
  },
  button: {
    padding: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pageCounter: {
    fontSize: 14,
    fontWeight: "500",
  },
});
