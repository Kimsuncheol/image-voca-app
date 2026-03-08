import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DashboardElement,
  useDashboardSettingsStore,
} from "../../src/stores/dashboardSettingsStore";

interface DashboardLayoutModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface ElementConfig {
  id: DashboardElement;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}

const ELEMENT_CONFIGS: Record<DashboardElement, ElementConfig> = {
  quiz: {
    id: "quiz",
    label: "Pop Quiz",
    icon: "help-circle",
    color: "#5856D6",
  },
  famousQuote: {
    id: "famousQuote",
    label: "Famous Quote",
    icon: "chatbubble-ellipses",
    color: "#FF9500",
  },
  stats: {
    id: "stats",
    label: "Stats",
    icon: "bar-chart",
    color: "#34C759",
  },
};

interface Preset {
  name: string;
  order: DashboardElement[];
}

interface CarouselMetrics {
  cardWidth: number;
  cardGap: number;
  snapInterval: number;
  sideInset: number;
}

function presetsEqual(a: DashboardElement[], b: DashboardElement[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function MiniElementRow({ config }: { config: ElementConfig }) {
  return (
    <View style={[miniStyles.bar, { backgroundColor: config.color + "40" }]}>
      <Ionicons name={config.icon} size={40} color={config.color} />
    </View>
  );
}

function PresetCard({
  preset,
  index,
  isSelected,
  scrollX,
  metrics,
  onSelect,
  isDark,
}: {
  preset: Preset;
  index: number;
  isSelected: boolean;
  scrollX: SharedValue<number>;
  metrics: CarouselMetrics;
  onSelect: () => void;
  isDark: boolean;
}) {
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const borderColor = isSelected ? "#007AFF" : isDark ? "#38383a" : "#e5e5ea";
  const textColor = isDark ? "#fff" : "#000";
  const centerOffset = index * metrics.snapInterval;

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      centerOffset - metrics.snapInterval,
      centerOffset,
      centerOffset + metrics.snapInterval,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], "clamp");
    const translateY = interpolate(scrollX.value, inputRange, [10, 0, 10], "clamp");
    const opacity = interpolate(scrollX.value, inputRange, [0.75, 1, 0.75], "clamp");

    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const parallaxAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      centerOffset - metrics.snapInterval,
      centerOffset,
      centerOffset + metrics.snapInterval,
    ];
    const translateX = interpolate(scrollX.value, inputRange, [-12, 0, 12], "clamp");

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View
      style={[
        presetStyles.cardContainer,
        { width: metrics.cardWidth, marginRight: metrics.cardGap },
        cardAnimatedStyle,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onSelect}
        testID={`preset-card-${index}`}
        style={[presetStyles.card, { backgroundColor: cardBg, borderColor }]}
      >
        <Text style={[presetStyles.name, { color: textColor }]}>
          {preset.name}
        </Text>

        <Animated.View style={[presetStyles.elements, parallaxAnimatedStyle]}>
          {preset.order.map((id) => (
            <MiniElementRow key={id} config={ELEMENT_CONFIGS[id]} />
          ))}
        </Animated.View>

        <View style={presetStyles.radio}>
          <Ionicons
            name={isSelected ? "radio-button-on" : "radio-button-off"}
            size={20}
            color={isSelected ? "#007AFF" : isDark ? "#636366" : "#c7c7cc"}
            testID={`preset-radio-${index}-${isSelected ? "selected" : "unselected"}`}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DashboardLayoutModal({
  visible,
  onClose,
  isDark,
}: DashboardLayoutModalProps) {
  const { t } = useTranslation();
  const { elementOrder, setElementOrder } = useDashboardSettingsStore();
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<Preset>>(null);
  const scrollX = useSharedValue(0);

  const PRESETS: Preset[] = useMemo(
    () => [
      {
        name: t("settings.dashboard.layoutModal.quizFirst"),
        order: ["quiz", "famousQuote", "stats"],
      },
      {
        name: t("settings.dashboard.layoutModal.quoteFirst"),
        order: ["famousQuote", "quiz", "stats"],
      },
    ],
    [t],
  );

  const metrics = useMemo<CarouselMetrics>(() => {
    const cardGap = 12;
    const cardWidth = Math.min(240, Math.max(screenWidth - 96, 0));
    const snapInterval = cardWidth + cardGap;
    const sideInset = Math.max((screenWidth - cardWidth) / 2, 0);

    return { cardWidth, cardGap, snapInterval, sideInset };
  }, [screenWidth]);

  const selectedPresetIndex = useMemo(
    () => PRESETS.findIndex((preset) => presetsEqual(elementOrder, preset.order)),
    [PRESETS, elementOrder],
  );

  const bg = isDark ? "#000" : "#f2f2f7";
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const borderColor = isDark ? "#38383a" : "#e5e5ea";
  const textColor = isDark ? "#fff" : "#000";
  const mutedColor = isDark ? "#8e8e93" : "#6d6d72";

  const scrollToPreset = useCallback(
    (index: number, animated: boolean) => {
      if (index < 0) return;

      listRef.current?.scrollToOffset?.({
        offset: index * metrics.snapInterval,
        animated,
      });
    },
    [metrics.snapInterval],
  );

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    if (!visible || selectedPresetIndex < 0) return;

    const frame = requestAnimationFrame(() => {
      scrollToPreset(selectedPresetIndex, false);
      scrollX.value = selectedPresetIndex * metrics.snapInterval;
    });

    return () => cancelAnimationFrame(frame);
  }, [metrics.snapInterval, scrollToPreset, scrollX, selectedPresetIndex, visible]);

  const renderPreset = useCallback(
    ({ item, index }: { item: Preset; index: number }) => (
      <PresetCard
        preset={item}
        index={index}
        isSelected={presetsEqual(elementOrder, item.order)}
        scrollX={scrollX}
        metrics={metrics}
        onSelect={() => {
          setElementOrder(item.order);
          scrollToPreset(index, true);
        }}
        isDark={isDark}
      />
    ),
    [elementOrder, isDark, metrics, scrollToPreset, scrollX, setElementOrder],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<Preset> | null | undefined, index: number) => ({
      length: metrics.snapInterval,
      offset: metrics.snapInterval * index,
      index,
    }),
    [metrics.snapInterval],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: bg }]}
        edges={["top", "left", "right", "bottom"]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: cardBg, borderBottomColor: borderColor },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t("settings.dashboard.layoutModal.title")}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Hint */}
        <Text style={[styles.hint, { color: mutedColor }]}>
          {t("settings.dashboard.layoutModal.hint")}
        </Text>

        <Animated.FlatList
          ref={listRef}
          data={PRESETS}
          horizontal
          keyExtractor={(item) => item.name}
          renderItem={renderPreset}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={metrics.snapInterval}
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: metrics.sideInset },
          ]}
          getItemLayout={getItemLayout}
          testID="dashboard-layout-carousel"
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerPlaceholder: {
    width: 32,
  },
  hint: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  listContent: {
    alignItems: "flex-start",
  },
});

const presetStyles = StyleSheet.create({
  cardContainer: {
    paddingVertical: 6,
  },
  card: {
    height: 420,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  elements: {
    flex: 1,
    gap: 14,
  },
  radio: {
    alignItems: "center",
    marginTop: 4,
  },
});

const miniStyles = StyleSheet.create({
  bar: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
