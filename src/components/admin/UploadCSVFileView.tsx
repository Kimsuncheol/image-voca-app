import React, { useRef } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import CsvUploadItemView, { CsvUploadItem } from "./CsvUploadItemView";

const { height } = Dimensions.get("window");

interface UploadCSVFileViewProps {
  items: CsvUploadItem[];
  setItems: React.Dispatch<React.SetStateAction<CsvUploadItem[]>>;
  loading: boolean;
  isDark: boolean;
  onPickDocument: (itemId: string) => void;
}

export default function UploadCSVFileView({
  items,
  setItems,
  loading,
  isDark,
  onPickDocument,
}: UploadCSVFileViewProps) {
  const styles = getStyles(isDark);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setItems([{ id: Date.now().toString(), day: "", file: null }]);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateDay = (id: string, text: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, day: text } : item)),
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.scrollContent}
    >
      {items.map((item, index) => (
        <CsvUploadItemView
          key={item.id}
          index={index}
          item={item}
          showDelete={items.length > 1}
          onDelete={() => handleRemoveItem(item.id)}
          onUpdateDay={(text) => handleUpdateDay(item.id, text)}
          onPickFile={() => onPickDocument(item.id)}
          loading={loading}
          isDark={isDark}
        />
      ))}
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
      marginVertical: 16,
    },
    scrollContent: {
      paddingBottom: height * 0.1,
      paddingHorizontal: 20,
    },
  });
