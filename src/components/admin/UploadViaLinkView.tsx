import React, { useRef } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import GoogleSheetUploadItemView, {
  SheetUploadItem,
} from "./GoogleSheetUploadItemView";

const { height } = Dimensions.get("window");

interface UploadViaLinkViewProps {
  items: SheetUploadItem[];
  setItems: React.Dispatch<React.SetStateAction<SheetUploadItem[]>>;
  loading: boolean;
  isDark: boolean;
}

export default function UploadViaLinkView({
  items,
  setItems,
  loading,
  isDark,
}: UploadViaLinkViewProps) {
  const styles = getStyles(isDark);
  const scrollViewRef = useRef<ScrollView>(null);

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
      <Text style={styles.sectionTitle}>Import from Google Sheets</Text>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
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
      </ScrollView>
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
      paddingHorizontal: 20,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
      marginVertical: 16,
    },
    scrollContent: {
      paddingBottom: height * 0.1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
  });
