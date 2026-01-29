import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import AddAnotherButton from "./AddAnotherButton";
import GoogleSheetUploadItemView, {
  SheetUploadItem,
} from "./GoogleSheetUploadItemView";
import UploadFooter from "./UploadFooter";

const { height } = Dimensions.get("window");

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
          <GoogleSheetUploadItemView
            key={item.id}
            index={index}
            item={item}
            showDelete={items.length > 1}
            onDelete={() => handleRemoveItem(item.id)}
            onUpdate={(field, value) => handleUpdateItem(item.id, field, value)}
            loading={loading}
            isDark={isDark}
          />
        ))}

        <AddAnotherButton
          onPress={handleAddItem}
          disabled={loading}
          text="Add Another Link"
          borderColor={borderColor}
          fontColor={borderColor}
        />

        {loading && <Text style={styles.progressText}>{progress}</Text>}
      </ScrollView>

      <UploadFooter
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
        isDark={isDark}
      />
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
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
      marginVertical: 16,
    },
    progressText: {
      textAlign: "center",
      fontSize: 14,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginVertical: 20,
    },
    scrollContent: {
      paddingBottom: height * 0.175, // Sufficient space for the bottom component
      paddingHorizontal: 20,
      paddingTop: 20,
    },
  });
