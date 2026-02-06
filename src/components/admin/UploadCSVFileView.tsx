import React, { useRef } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import CsvUploadItemView, { CsvUploadItem } from "./CsvUploadItemView";

const { height } = Dimensions.get("window");

interface UploadCSVFileViewProps {
  item: CsvUploadItem;
  setItem: React.Dispatch<React.SetStateAction<CsvUploadItem>>;
  loading: boolean;
  isDark: boolean;
  onPickDocument: () => void;
}

export default function UploadCSVFileView({
  item,
  setItem,
  loading,
  isDark,
  onPickDocument,
}: UploadCSVFileViewProps) {
  const styles = getStyles(isDark);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleUpdateDay = (text: string) => {
    setItem((prev) => ({ ...prev, day: text }));
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.scrollContent}
    >
      <CsvUploadItemView
        index={0}
        item={item}
        showDelete={false}
        showIndex={false}
        onDelete={() => {}}
        onUpdateDay={handleUpdateDay}
        onPickFile={onPickDocument}
        loading={loading}
        isDark={isDark}
      />
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: isDark ? "#38383a" : "#e5e5ea",
    },
    scrollContent: {
      paddingBottom: height * 0.1,
      paddingHorizontal: 20,
    },
  });
