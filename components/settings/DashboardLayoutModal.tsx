import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
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

interface Preset {
  name: string;
  order: DashboardElement[];
}

const PRESETS: Preset[] = [
  { name: "Quiz First", order: ["quiz", "famousQuote", "stats"] },
  { name: "Quote First", order: ["famousQuote", "quiz", "stats"] },
];

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
  isSelected,
  onSelect,
  isDark,
}: {
  preset: Preset;
  isSelected: boolean;
  onSelect: () => void;
  isDark: boolean;
}) {
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const borderColor = isSelected ? "#007AFF" : isDark ? "#38383a" : "#e5e5ea";
  const textColor = isDark ? "#fff" : "#000";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      style={[presetStyles.card, { backgroundColor: cardBg, borderColor }]}
    >
      <Text style={[presetStyles.name, { color: textColor }]}>
        {preset.name}
      </Text>

      <View style={presetStyles.elements}>
        {preset.order.map((id) => (
          <MiniElementRow key={id} config={ELEMENT_CONFIGS[id]} />
        ))}
      </View>

      <View style={presetStyles.radio}>
        <Ionicons
          name={isSelected ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={isSelected ? "#007AFF" : isDark ? "#636366" : "#c7c7cc"}
        />
      </View>
    </TouchableOpacity>
  );
}

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
          <Text style={[styles.headerTitle, { color: textColor }]}>Layout</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Hint */}
        <Text style={[styles.hint, { color: mutedColor }]}>
          Choose a layout preset
        </Text>

        {/* Horizontal preset list */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {PRESETS.map((preset, idx) => (
            <PresetCard
              key={idx}
              preset={preset}
              isSelected={presetsEqual(elementOrder, preset.order)}
              onSelect={() => setElementOrder(preset.order)}
              isDark={isDark}
            />
          ))}
        </ScrollView>
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
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "flex-start",
  },
});

const presetStyles = StyleSheet.create({
  card: {
    width: 200,
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
