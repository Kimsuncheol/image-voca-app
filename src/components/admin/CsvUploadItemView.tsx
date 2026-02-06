import React from "react";
import { StyleSheet, View } from "react-native";
import DayInput from "./DayInput";
import FilePicker from "./FilePicker";
import UploadItemHeader from "./UploadItemHeader";

export interface CsvUploadItem {
  id: string;
  day: string;
  file: any;
}

interface CsvUploadItemViewProps {
  index: number;
  item: CsvUploadItem;
  showDelete: boolean;
  onDelete: () => void;
  onUpdateDay: (text: string) => void;
  onPickFile: () => void;
  loading: boolean;
  isDark: boolean;
  showIndex?: boolean;
}

export default function CsvUploadItemView({
  index,
  item,
  showDelete,
  onDelete,
  onUpdateDay,
  onPickFile,
  loading,
  isDark,
  showIndex = true,
}: CsvUploadItemViewProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.itemContainer}>
      <UploadItemHeader
        index={index}
        showDelete={showDelete}
        onDelete={onDelete}
        titlePrefix="Upload"
        isDark={isDark}
        showIndex={showIndex}
      />

      <DayInput
        value={item.day}
        onChangeText={onUpdateDay}
        editable={!loading}
        isDark={isDark}
      />

      <FilePicker
        file={item.file}
        onPick={onPickFile}
        loading={loading}
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
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
  });
