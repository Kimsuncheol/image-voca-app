import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

export function DashboardLayoutModal({
  visible,
  onClose,
  isDark,
}: DashboardLayoutModalProps) {
  const { elementOrder, setElementOrder } = useDashboardSettingsStore();

  const bg = isDark ? "#000" : "#f2f2f7";
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const borderColor = isDark ? "#38383a" : "#e5e5ea";
  const textColor = isDark ? "#fff" : "#000";
  const mutedColor = isDark ? "#8e8e93" : "#6d6d72";

  const renderItem = ({ item, drag, isActive }: RenderItemParams<DashboardElement>) => {
    const config = ELEMENT_CONFIGS[item];
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          activeOpacity={0.9}
          style={[
            styles.item,
            { backgroundColor: cardBg, borderColor: isActive ? "#007AFF" : borderColor },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: config.color + "20" }]}>
            <Ionicons name={config.icon} size={28} color={config.color} />
          </View>
          <Text style={[styles.itemLabel, { color: textColor }]}>{config.label}</Text>
          <Ionicons name="menu-outline" size={18} color={mutedColor} style={styles.dragHandle} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView
          style={[styles.container, { backgroundColor: bg }]}
          edges={["top", "left", "right", "bottom"]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Layout</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Hint */}
          <Text style={[styles.hint, { color: mutedColor }]}>
            Hold and drag to reorder
          </Text>

          {/* Horizontal draggable list */}
          <View style={styles.listWrapper}>
            <DraggableFlatList
              data={elementOrder}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              onDragEnd={({ data }) => setElementOrder(data)}
              horizontal
              contentContainerStyle={styles.listContent}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
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
  listWrapper: {
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "center",
  },
  item: {
    width: 110,
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "relative",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  dragHandle: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
