import { FontWeights } from "@/constants/fontWeights";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { FontSizes } from "@/constants/fontSizes";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const BUTTON_WIDTH = 96;
const SNAP_THRESHOLD = 48;
const AUTO_DELETE_THRESHOLD = 200;
const AUTO_DELETE_VELOCITY = 1200;

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
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const handleDelete = useCallback(() => {
    onDelete(itemId);
  }, [itemId, onDelete]);

  const animateAndDelete = useCallback(() => {
    translateX.value = withTiming(-500, { duration: 280 }, (done) => {
      if (done) runOnJS(handleDelete)();
    });
  }, [translateX, handleDelete]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      t("wordBank.deleteConfirm.title"),
      t("wordBank.deleteConfirm.message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () => {
            translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            isOpen.value = false;
          },
        },
        {
          text: t("wordBank.deleteConfirm.confirm"),
          style: "destructive",
          onPress: animateAndDelete,
        },
      ],
    );
  }, [t, translateX, isOpen, animateAndDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const base = isOpen.value ? -BUTTON_WIDTH : 0;
      translateX.value = Math.min(0, base + e.translationX);
    })
    .onEnd((e) => {
      const shouldAutoDelete =
        translateX.value < -AUTO_DELETE_THRESHOLD ||
        e.velocityX < -AUTO_DELETE_VELOCITY;
      const shouldOpen = translateX.value < -SNAP_THRESHOLD;

      if (shouldAutoDelete) {
        translateX.value = withTiming(-500, { duration: 280 }, (done) => {
          if (done) runOnJS(handleDelete)();
        });
      } else if (shouldOpen) {
        translateX.value = withSpring(-BUTTON_WIDTH, {
          damping: 20,
          stiffness: 200,
        });
        isOpen.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isOpen.value = false;
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    width: Math.max(0, -translateX.value),
    opacity: Math.min(1, -translateX.value / BUTTON_WIDTH),
  }));

  const deleteColor = isDark ? "#FF453A" : "#FF3B30";

  return (
    <View testID={`swipe-row-${itemId}`} style={styles.container}>
      <Animated.View
        style={[
          styles.deleteBackground,
          { backgroundColor: deleteColor },
          deleteBackgroundStyle,
        ]}
      >
        <Pressable
          testID={`delete-action-${itemId}`}
          onPress={handleDeletePress}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteText}>{t("common.delete")}</Text>
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // WordCard already has marginBottom: 12 — no extra margin needed here
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 12, // match WordCard's marginBottom so button aligns with card
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  deleteButton: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteText: {
    color: "#fff",
    fontSize: FontSizes.label,
    fontWeight: FontWeights.bold,
  },
  card: {},
});
