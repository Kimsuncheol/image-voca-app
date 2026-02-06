import React from "react";
import { StyleSheet, View } from "react-native";
import DayInput from "./DayInput";
import RangeInput from "./RangeInput";
import SheetIdInput from "./SheetIdInput";
import UploadItemHeader from "./UploadItemHeader";

export interface SheetUploadItem {
  id: string;
  day: string;
  sheetId: string;
  range: string;
}

interface GoogleSheetUploadItemViewProps {
  index: number;
  item: SheetUploadItem;
  showDelete: boolean;
  onDelete: () => void;
  onUpdate: (field: keyof SheetUploadItem, value: string) => void;
  loading: boolean;
  isDark: boolean;
  showIndex?: boolean;
}

export default function GoogleSheetUploadItemView({
  index,
  item,
  showDelete,
  onDelete,
  onUpdate,
  loading,
  isDark,
  showIndex = true,
}: GoogleSheetUploadItemViewProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.itemContainer}>
      <UploadItemHeader
        index={index}
        showDelete={showDelete}
        onDelete={onDelete}
        titlePrefix="Import"
        isDark={isDark}
        showIndex={showIndex}
      />

      <DayInput
        value={item.day}
        onChangeText={(text) => onUpdate("day", text)}
        editable={!loading}
        isDark={isDark}
      />

      <SheetIdInput
        value={item.sheetId}
        onChangeText={(text) => onUpdate("sheetId", text)}
        editable={!loading}
        isDark={isDark}
      />

      <RangeInput
        value={item.range}
        onChangeText={(text) => onUpdate("range", text)}
        editable={!loading}
        isDark={isDark}
      />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    itemContainer: {
      backgroundColor: isDark ? "#2c2c2e" : "#fff",
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
  });
