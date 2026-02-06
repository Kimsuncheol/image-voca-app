import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { CsvUploadItem } from "./CsvUploadItemView";
import { SheetUploadItem } from "./GoogleSheetUploadItemView";

type ListItemType = "csv" | "link";
const DELETE_ACTION_WIDTH = 96;

interface UploadListItemProps {
  itemKey: string;
  type: ListItemType;
  item: CsvUploadItem | SheetUploadItem;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  onSwipeableOpen: (itemKey: string) => void;
  registerSwipeableRef: (itemKey: string, ref: SwipeableMethods | null) => void;
  showDelete: boolean;
  isDark: boolean;
}

interface RightDeleteActionProps {
  day: string;
  index: number;
  progress: SharedValue<number>;
  onDelete: () => void;
}

function RightDeleteAction({
  day,
  index,
  progress,
  onDelete,
}: RightDeleteActionProps) {
  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0.45, 1],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.92, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <TouchableOpacity
      style={actionStyles.deleteAction}
      onPress={onDelete}
      testID={`swipe-delete-${index}`}
      accessibilityRole="button"
      accessibilityLabel={`Delete Day ${day || "item"}`}
    >
      <Animated.View style={[actionStyles.deleteActionContent, animatedContentStyle]}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={actionStyles.deleteActionText}>Delete</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function UploadListItem({
  itemKey,
  type,
  item,
  index,
  onPress,
  onDelete,
  onSwipeableOpen,
  registerSwipeableRef,
  showDelete,
  isDark,
}: UploadListItemProps) {
  const styles = getStyles(isDark);

  const handleSwipeableRef = useCallback(
    (ref: SwipeableMethods | null) => {
      registerSwipeableRef(itemKey, ref);
    },
    [itemKey, registerSwipeableRef],
  );

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
      <ReanimatedSwipeable
        ref={handleSwipeableRef}
        renderRightActions={(progress, _translation, swipeableMethods) => (
          <RightDeleteAction
            day={item.day}
            index={index}
            progress={progress}
            onDelete={() => {
              swipeableMethods.close();
              onDelete();
            }}
          />
        )}
        onSwipeableOpen={(direction) => {
          if (direction === "right") {
            onSwipeableOpen(itemKey);
          }
        }}
        overshootRight={false}
        rightThreshold={Math.floor(DELETE_ACTION_WIDTH * 0.8)}
      >
        {rowContent}
      </ReanimatedSwipeable>
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
  });

const actionStyles = StyleSheet.create({
  deleteAction: {
    width: DELETE_ACTION_WIDTH,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  deleteActionContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
