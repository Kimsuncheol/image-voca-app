import React, { useCallback, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
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
  const swipeableRefs = useRef<Map<string, SwipeableMethods>>(
    new Map<string, SwipeableMethods>(),
  );
  const activeOpenKeyRef = useRef<string | null>(null);

  const registerSwipeableRef = useCallback(
    (itemKey: string, ref: SwipeableMethods | null) => {
      if (ref) {
        swipeableRefs.current.set(itemKey, ref);
        return;
      }

      swipeableRefs.current.delete(itemKey);
      if (activeOpenKeyRef.current === itemKey) {
        activeOpenKeyRef.current = null;
      }
    },
    [],
  );

  const closeSwipeableByKey = useCallback((itemKey: string | null) => {
    if (!itemKey) return;
    swipeableRefs.current.get(itemKey)?.close();
  }, []);

  const handleSwipeableOpen = useCallback(
    (itemKey: string) => {
      const activeKey = activeOpenKeyRef.current;
      if (activeKey && activeKey !== itemKey) {
        closeSwipeableByKey(activeKey);
      }
      activeOpenKeyRef.current = itemKey;
    },
    [closeSwipeableByKey],
  );

  const handlePressItem = useCallback(
    (index: number) => {
      closeSwipeableByKey(activeOpenKeyRef.current);
      activeOpenKeyRef.current = null;
      onPressItem(index);
    },
    [closeSwipeableByKey, onPressItem],
  );

  const handleDeleteItem = useCallback(
    (index: number, itemKey: string) => {
      closeSwipeableByKey(activeOpenKeyRef.current);
      if (activeOpenKeyRef.current === itemKey) {
        activeOpenKeyRef.current = null;
      }
      onDeleteItem(index);
    },
    [closeSwipeableByKey, onDeleteItem],
  );

  return (
    <View style={styles.listContent}>
      {items.length === 0 ? (
        <Text style={styles.emptyListText}>No items added yet.</Text>
      ) : (
        items.map((item, index) => {
          const itemKey = `${item.id}-${index}`;

          return (
            <UploadListItem
              key={itemKey}
              itemKey={itemKey}
              type={type}
              item={item}
              index={index}
              onPress={() => handlePressItem(index)}
              onDelete={() => handleDeleteItem(index, itemKey)}
              onSwipeableOpen={handleSwipeableOpen}
              registerSwipeableRef={registerSwipeableRef}
              showDelete={true}
              isDark={isDark}
            />
          );
        })
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
