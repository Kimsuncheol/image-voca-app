import React, { useRef } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import GoogleSheetUploadItemView, {
  SheetUploadItem,
} from "./GoogleSheetUploadItemView";

const { height } = Dimensions.get("window");

interface UploadViaLinkViewProps {
  item: SheetUploadItem;
  setItem: React.Dispatch<React.SetStateAction<SheetUploadItem>>;
  loading: boolean;
  isDark: boolean;
}

export default function UploadViaLinkView({
  item,
  setItem,
  loading,
  isDark,
}: UploadViaLinkViewProps) {
  const styles = getStyles(isDark);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleUpdateItem = (
    field: keyof SheetUploadItem,
    value: string,
  ) => {
    setItem((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Import from Google Sheets</Text>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
      >
        <GoogleSheetUploadItemView
          index={0}
          item={item}
          showDelete={false}
          showIndex={false}
          onDelete={() => {}}
          onUpdate={(field, value) => handleUpdateItem(field, value)}
          loading={loading}
          isDark={isDark}
        />
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
