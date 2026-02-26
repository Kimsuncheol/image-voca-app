import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../themed-text";
import {
  CollocationDisplay,
  OtherDisplay,
  useWordBankDisplayStore,
} from "../../src/stores/wordBankDisplayStore";

interface WordBankSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface RadioOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  isLast?: boolean;
}

function RadioOption({
  label,
  description,
  selected,
  onPress,
  isDark,
  isLast,
}: RadioOptionProps) {
  return (
    <TouchableOpacity
      style={[
        radioStyles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "#38383a" : "#e5e5ea",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={radioStyles.textContainer}>
        <ThemedText style={radioStyles.label}>{label}</ThemedText>
        <ThemedText style={[radioStyles.description, { color: isDark ? "#8e8e93" : "#6d6d72" }]}>
          {description}
        </ThemedText>
      </View>
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={selected ? "#007AFF" : isDark ? "#48484a" : "#c7c7cc"}
      />
    </TouchableOpacity>
  );
}

const radioStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});

export function WordBankSettingsModal({
  visible,
  onClose,
  isDark,
}: WordBankSettingsModalProps) {
  const {
    collocationDisplay,
    otherDisplay,
    setCollocationDisplay,
    setOtherDisplay,
  } = useWordBankDisplayStore();

  const bg = isDark ? "#000" : "#f2f2f7";
  const cardBg = isDark ? "#1c1c1e" : "#fff";
  const sectionLabelColor = isDark ? "#8e8e93" : "#6d6d72";
  const borderColor = isDark ? "#38383a" : "#e5e5ea";

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
            <Ionicons
              name="close"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Card Display</ThemedText>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Collocations Section */}
        <ThemedText
          style={[styles.sectionLabel, { color: sectionLabelColor }]}
        >
          COLLOCATIONS
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <RadioOption
            label="Collocation + Meaning"
            description="Show word and meaning only as a simple card"
            selected={collocationDisplay === "meaning_only"}
            onPress={() => setCollocationDisplay("meaning_only" as CollocationDisplay)}
            isDark={isDark}
          />
          <RadioOption
            label="Full Flip Card"
            description="Show the full flip card with explanation and example"
            selected={collocationDisplay === "all"}
            onPress={() => setCollocationDisplay("all" as CollocationDisplay)}
            isDark={isDark}
            isLast
          />
        </View>

        {/* Other Courses Section */}
        <ThemedText
          style={[styles.sectionLabel, { color: sectionLabelColor }]}
        >
          OTHER COURSES
        </ThemedText>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <RadioOption
            label="Word + Meaning Only"
            description="Show word and meaning, hide example sentences"
            selected={otherDisplay === "word_meaning_only"}
            onPress={() => setOtherDisplay("word_meaning_only" as OtherDisplay)}
            isDark={isDark}
          />
          <RadioOption
            label="Show All"
            description="Show word, meaning, pronunciation, and examples"
            selected={otherDisplay === "all"}
            onPress={() => setOtherDisplay("all" as OtherDisplay)}
            isDark={isDark}
            isLast
          />
        </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 24,
    marginBottom: 6,
    paddingHorizontal: 20,
    letterSpacing: 0.4,
  },
  sectionCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
});
