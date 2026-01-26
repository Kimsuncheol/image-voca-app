import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AddAnotherButton from "./AddAnotherButton";
import DayInput from "./DayInput";
import RangeInput from "./RangeInput";
import SheetIdInput from "./SheetIdInput";
import UploadActionButton from "./UploadActionButton";
import UploadItemHeader from "./UploadItemHeader";

export interface SheetUploadItem {
  id: string;
  day: string;
  sheetId: string;
  range: string;
}

interface UploadViaLinkViewProps {
  items: SheetUploadItem[];
  setItems: React.Dispatch<React.SetStateAction<SheetUploadItem[]>>;
  loading: boolean;
  progress: string;
  isDark: boolean;
  token: string | null;
  waitingForToken: boolean;
  onImport: () => void;
}

export default function UploadViaLinkView({
  items,
  setItems,
  loading,
  progress,
  isDark,
  token,
  waitingForToken,
  onImport,
}: UploadViaLinkViewProps) {
  const styles = getStyles(isDark);
  const borderColor = "#0F9D58";

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        day: "",
        sheetId: "",
        range: "Sheet1!A:E",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setItems([
        {
          id: Date.now().toString(),
          day: "",
          sheetId: "",
          range: "Sheet1!A:E",
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof SheetUploadItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Import from Google Sheets</Text>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemContainer}>
            <UploadItemHeader
              index={index}
              showDelete={items.length > 1}
              onDelete={() => handleRemoveItem(item.id)}
              titlePrefix="Import"
              isDark={isDark}
            />

            <DayInput
              value={item.day}
              onChangeText={(text) => handleUpdateItem(item.id, "day", text)}
              editable={!loading}
              isDark={isDark}
            />

            <SheetIdInput
              value={item.sheetId}
              onChangeText={(text) =>
                handleUpdateItem(item.id, "sheetId", text)
              }
              editable={!loading}
              isDark={isDark}
            />

            <RangeInput
              value={item.range}
              onChangeText={(text) => handleUpdateItem(item.id, "range", text)}
              editable={!loading}
              isDark={isDark}
            />
          </View>
        ))}
        {loading && <Text style={styles.progressText}>{progress}</Text>}
      </ScrollView>

      <View style={styles.bottomComponent}>
        <AddAnotherButton
          onPress={handleAddItem}
          disabled={loading}
          text="Add Another Link"
          borderColor={borderColor}
        />

        {/* <View style={styles.divider} /> */}

        <UploadActionButton
          onPress={onImport}
          loading={loading}
          disabled={loading}
          text={
            token
              ? `Import ${items.filter((i) => i.sheetId && i.day).length} Item(s)`
              : "Connect & Import"
          }
          iconName="grid"
          backgroundColor="#0F9D58"
        />
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
      marginBottom: 16,
    },
    itemContainer: {
      backgroundColor: isDark ? "#2c2c2e" : "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
      marginVertical: 16,
    },
    progressText: {
      textAlign: "center",
      fontSize: 14,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginBottom: 20,
    },
    bottomComponent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? "#000" : "#f2f2f7", // Match screen background or container background
      paddingHorizontal: 20,
      paddingVertical: 16,
      justifyContent: "center",
      gap: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#c6c6c8",
    },
    scrollContent: {
      paddingBottom: 200, // Sufficient space for the bottom component
      paddingHorizontal: 20,
      paddingTop: 20,
    },
  });
