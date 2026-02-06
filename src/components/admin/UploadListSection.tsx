import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CsvUploadItem } from "./CsvUploadItemView";
import { SheetUploadItem } from "./GoogleSheetUploadItemView";
import UploadListItem from "./UploadListItem";

type ListItemType = "csv" | "link";

interface UploadListSectionProps {
  type: ListItemType;
  items: Array<CsvUploadItem | SheetUploadItem>;
  onPressItem: (index: number) => void;
  onDeleteItem: (index: number) => void;
  isDark: boolean;
}

export default function UploadListSection({
  type,
  items,
  onPressItem,
  onDeleteItem,
  isDark,
}: UploadListSectionProps) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.listContent}>
      {items.length === 0 ? (
        <Text style={styles.emptyListText}>No items added yet.</Text>
      ) : (
        items.map((item, index) => (
          <UploadListItem
            key={`${item.id}-${index}`}
            type={type}
            item={item}
            index={index}
            onPress={() => onPressItem(index)}
            onDelete={() => onDeleteItem(index)}
            showDelete={true}
            isDark={isDark}
          />
        ))
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    emptyListText: {
      textAlign: "center",
      color: isDark ? "#8e8e93" : "#6e6e73",
      fontSize: 14,
      paddingVertical: 24,
    },
  });
