import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../src/context/ThemeContext";

interface WordArrangementAvailableChunksProps {
  chunks: string[];
  onChunkSelect: (chunk: string, index: number) => void;
}

interface DraggableChunkProps {
  chunk: string;
  index: number;
  isDark: boolean;
  onSelect: (chunk: string, index: number) => void;
}

function DraggableChunk({
  chunk,
  index,
  isDark,
  onSelect,
}: DraggableChunkProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleSelect = () => {
    onSelect(chunk, index);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      // When drag ends, trigger selection and reset position
      runOnJS(handleSelect)();
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.chunk,
            { backgroundColor: isDark ? "#2c2c2e" : "#e8e8ed" },
          ]}
          onPress={handleSelect}
          activeOpacity={0.7}
        >
          <Text style={[styles.chunkText, { color: isDark ? "#fff" : "#000" }]}>
            {chunk}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

export function WordArrangementAvailableChunks({
  chunks,
  onChunkSelect,
}: WordArrangementAvailableChunksProps) {
  const { isDark } = useTheme();

  if (chunks.length === 0) return null;

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={styles.availableZone}>
        <View style={styles.chunksRow}>
          {chunks.map((chunk, index) => (
            <DraggableChunk
              key={`available-${index}-${chunk}`}
              chunk={chunk}
              index={index}
              isDark={isDark}
              onSelect={onChunkSelect}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 0,
  },
  availableZone: {
    marginTop: 8,
  },
  chunksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chunk: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chunkText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
