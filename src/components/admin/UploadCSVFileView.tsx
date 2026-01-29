import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AddAnotherButton from "./AddAnotherButton";
import CsvUploadItemView, { CsvUploadItem } from "./CsvUploadItemView";
import UploadActionButton from "./UploadActionButton";

interface UploadCSVFileViewProps {
  items: CsvUploadItem[];
  setItems: React.Dispatch<React.SetStateAction<CsvUploadItem[]>>;
  loading: boolean;
  progress: string;
  isDark: boolean;
  onPickDocument: (itemId: string) => void;
  onUpload: () => void;
}

export default function UploadCSVFileView({
  items,
  setItems,
  loading,
  progress,
  isDark,
  onPickDocument,
  onUpload,
}: UploadCSVFileViewProps) {
  const styles = getStyles(isDark);
  const borderColor = "#007AFF";

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), day: "", file: null },
    ]);
  };

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
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
        {loading && <Text style={styles.progressText}>{progress}</Text>}
      </ScrollView>

      {/* Bottom Component */}
      <View style={styles.bottomComponent}>
        <AddAnotherButton
          onPress={handleAddItem}
          disabled={loading}
          text="Add Another Day"
          borderColor={borderColor}
        />

        <UploadActionButton
          onPress={onUpload}
          loading={loading}
          disabled={loading}
          text={`Upload ${items.filter((i) => i.file && i.day).length} Item(s)`}
          iconName="cloud-upload"
        />
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
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
      justifyContent: "center",
      gap: 16,
      backgroundColor: isDark ? "#000" : "#f2f2f7", // Match screen background or container background
      padding: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "#38383a" : "#c6c6c8",
    },
    scrollContent: {
      paddingBottom: 200, // Sufficient space for the bottom component
      paddingHorizontal: 20,
    },
  });
