import { FontWeights } from "@/constants/fontWeights";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontSizes } from "@/constants/fontSizes";

interface SwipeToDeleteRowProps {
  itemId: string;
  isDark: boolean;
  onDelete: (wordId: string) => void;
  children: React.ReactNode;
}

export function SwipeToDeleteRow({
  itemId,
  isDark,
  onDelete,
  children,
}: SwipeToDeleteRowProps) {
  const handleDelete = React.useCallback(() => {
    onDelete(itemId);
  }, [itemId, onDelete]);

  return (
    <View testID={`swipe-row-${itemId}`} style={styles.row}>
      <View style={styles.cardContainer}>{children}</View>
      <Pressable
        testID={`delete-action-${itemId}`}
        onPress={handleDelete}
        style={[
          styles.deleteAction,
          isDark ? styles.deleteActionDark : styles.deleteActionLight,
        ]}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  cardContainer: {
    flex: 1,
  },
  deleteAction: {
    width: 96,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  deleteActionLight: {
    backgroundColor: "#FF3B30",
  },
  deleteActionDark: {
    backgroundColor: "#FF453A",
  },
  deleteActionText: {
    color: "#fff",
    fontSize: FontSizes.bodyMd,
    fontWeight: FontWeights.bold,
  },
});
