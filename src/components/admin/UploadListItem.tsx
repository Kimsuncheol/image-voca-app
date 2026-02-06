import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { CsvUploadItem } from "./CsvUploadItemView";
import { SheetUploadItem } from "./GoogleSheetUploadItemView";

type ListItemType = "csv" | "link";
const DELETE_ACTION_WIDTH = 96;

interface UploadListItemProps {
  type: ListItemType;
  item: CsvUploadItem | SheetUploadItem;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  showDelete: boolean;
  isDark: boolean;
}

export default function UploadListItem({
  type,
  item,
  index,
  onPress,
  onDelete,
  showDelete,
  isDark,
}: UploadListItemProps) {
  const styles = getStyles(isDark);
  const isDeletingRef = useRef(false);

  const getTitle = () => {
    const day = item.day || "No day";
    return `Day ${day}`;
  };

  const getSubtitle = () => {
    if (type === "csv") {
      const csvItem = item as CsvUploadItem;
      return csvItem.file ? csvItem.file.name : "No file selected";
    } else {
      const sheetItem = item as SheetUploadItem;
      return sheetItem.sheetId
        ? `Sheet: ${sheetItem.sheetId.slice(0, 12)}...`
        : "No sheet ID";
    }
  };

  const iconName = type === "csv" ? "document-text-outline" : "link-outline";
  const iconColor = type === "csv" ? "#007AFF" : "#0F9D58";

  const rowContent = (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}
      >
        <Ionicons name={iconName} size={20} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {getSubtitle()}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#8e8e93" : "#c7c7cc"}
      />
    </TouchableOpacity>
  );

  if (!showDelete) {
    return <View style={styles.swipeWrapper}>{rowContent}</View>;
  }

  return (
    <View style={styles.swipeWrapper}>
      <Swipeable
        renderRightActions={() => (
          <View
            style={styles.deleteAction}
            testID={`swipe-delete-${index}`}
            accessibilityLabel={`Delete Day ${item.day || "item"}`}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteActionText}>Delete</Text>
          </View>
        )}
        onSwipeableOpen={(direction) => {
          if (direction === "right" && !isDeletingRef.current) {
            isDeletingRef.current = true;
            onDelete();
          }
        }}
        overshootRight={false}
        rightThreshold={DELETE_ACTION_WIDTH}
      >
        {rowContent}
      </Swipeable>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    swipeWrapper: {
      marginBottom: 8,
      borderRadius: 12,
      overflow: "hidden",
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 12,
      gap: 12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
    deleteAction: {
      width: DELETE_ACTION_WIDTH,
      backgroundColor: "#ff3b30",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
      borderRadius: 12,
    },
    deleteActionText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
  });
