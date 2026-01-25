import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Stack } from "expo-router";
import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import Papa from "papaparse";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddVocaHeader from "../../src/components/admin/AddVocaHeader";
import TabSwitcher from "../../src/components/admin/TabSwitcher";
import UploadCSVFileView, {
  CsvUploadItem,
} from "../../src/components/admin/UploadCSVFileView";
import UploadViaLinkView, {
  SheetUploadItem,
} from "../../src/components/admin/UploadViaLinkView";
import { useTheme } from "../../src/context/ThemeContext";
import useGoogleSheetsAuth from "../../src/hooks/useGoogleSheetsAuth";
import { db, storage } from "../../src/services/firebase";
import { parseSheetValues } from "../../src/utils/googleSheetsUtils";

type TabType = "csv" | "link";

export default function AddVocaScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  const COURSES = [
    { name: "CSAT", path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "" },
    { name: "IELTS", path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "" },
    { name: "TOEFL", path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "" },
    { name: "TOEIC", path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "" },
    {
      name: "COLLOCATION",
      path: process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION || "",
    },
  ];

  // State
  const [activeTab, setActiveTab] = useState<TabType>("csv");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);

  // CSV Items State
  const [csvItems, setCsvItems] = useState<CsvUploadItem[]>([
    { id: "1", day: "", file: null },
  ]);

  // Sheet Items State
  const [sheetItems, setSheetItems] = useState<SheetUploadItem[]>([
    { id: "1", day: "", sheetId: "", range: "Sheet1!A:E" },
  ]);

  // Google Sheets integration
  const { token, promptAsync } = useGoogleSheetsAuth();
  const [waitingForToken, setWaitingForToken] = useState(false);

  // CSV Handlers
  const handlePickDocument = async (itemId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setCsvItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, file } : item)),
      );
      console.log("[Picker] File selected for item", itemId, ":", file.name);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleBatchUpload = async () => {
    // Validation
    const invalidItems = csvItems.filter(
      (item) => !item.day.trim() || !item.file,
    );
    if (invalidItems.length > 0) {
      Alert.alert(
        "Validation Error",
        "Please ensure all items have a Day and a File selected.",
      );
      return;
    }

    try {
      setLoading(true);

      for (let i = 0; i < csvItems.length; i++) {
        const item = csvItems[i];
        const progressPrefix = `[${i + 1}/${csvItems.length}] Day ${item.day}: `;
        setProgress(`${progressPrefix}Starting...`);

        await processCsvItem(item, progressPrefix);
      }

      setLoading(false);
      setProgress("");
      setCsvItems([{ id: "1", day: "", file: null }]);
      Alert.alert("Success", "All files uploaded successfully!");
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  };

  const processCsvItem = async (
    item: CsvUploadItem,
    progressPrefix: string,
  ) => {
    // 1. Upload CSV to Storage
    setProgress(`${progressPrefix}Checking Storage...`);
    const storageRef = ref(
      storage,
      `csv/${selectedCourse.name}/Day${item.day}.csv`,
    );

    try {
      await getMetadata(storageRef);
      // File exists
    } catch (error: any) {
      // File doesn't exist, ignore
      console.log("[Storage] File doesn't exist (creating new):", error.code);
    }

    setProgress(`${progressPrefix}Uploading file to Storage...`);
    try {
      const response = await fetch(item.file.uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
    } catch (storageError: any) {
      console.error("[Storage] Upload failed:", storageError);
      // Continue anyway
    }

    // 2. Read and Parse
    setProgress(`${progressPrefix}Reading file...`);
    const fileContent = await FileSystem.readAsStringAsync(item.file.uri);

    setProgress(`${progressPrefix}Parsing CSV...`);
    return new Promise<void>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            await uploadData(results.data, item.day, progressPrefix);
            resolve();
          } catch (uploadError: any) {
            reject(uploadError);
          }
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  };

  // Google Sheets Handlers
  const handleSheetImportButton = async () => {
    // Validation
    const invalidItems = sheetItems.filter(
      (item) => !item.day.trim() || !item.sheetId.trim(),
    );
    if (invalidItems.length > 0) {
      Alert.alert(
        "Validation Error",
        "Please ensure all items have a Day and a Sheet ID.",
      );
      return;
    }

    if (!token) {
      setWaitingForToken(true);
      try {
        await promptAsync();
      } catch (e: any) {
        setWaitingForToken(false);
        Alert.alert("Auth Error", e.message);
      }
    } else {
      handleBatchSheetImport();
    }
  };

  // Shared upload logic
  const uploadData = useCallback(
    async (data: any[], day: string, progressPrefix: string) => {
      const fullPath = `${selectedCourse.path}/Day${day}`;

      // Clear existing data
      setProgress(`${progressPrefix}Clearing existing data...`);
      try {
        const querySnapshot = await getDocs(collection(db, fullPath));
        const deletePromises = querySnapshot.docs.map((doc) =>
          deleteDoc(doc.ref),
        );
        await Promise.all(deletePromises);
      } catch (deleteError) {
        throw new Error(`Failed to clear existing data for Day ${day}`);
      }

      // Upload new data
      setProgress(`${progressPrefix}Uploading ${data.length} records...`);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
          const word = String(
            item["Word"] || item["word"] || item["_1"] || "",
          ).trim();

          if (word === "Word" || !word) continue;

          let docData: any = {};

          if (selectedCourse.name === "COLLOCATION") {
            docData = {
              collocation: word,
              meaning: String(
                item["Meaning"] || item["meaning"] || item["_2"] || "",
              ).trim(),
              explanation: String(
                item["Explanation"] || item["explanation"] || item["_3"] || "",
              ).trim(),
              example: String(
                item["Example"] || item["example"] || item["_4"] || "",
              ).trim(),
              translation: String(
                item["Translation"] || item["translation"] || item["_5"] || "",
              ).trim(),
              createdAt: new Date(),
            };
          } else {
            docData = {
              word: word,
              meaning: String(
                item["Meaning"] || item["meaning"] || item["_2"] || "",
              ).trim(),
              translation: String(
                item["Translation"] || item["translation"] || item["_5"] || "",
              ).trim(),
              pronunciation: String(
                item["Pronounciation"] ||
                  item["Pronunciation"] ||
                  item["pronunciation"] ||
                  item["_3"] ||
                  "",
              ).trim(),
              example: String(
                item["Example sentence"] ||
                  item["Example"] ||
                  item["example"] ||
                  item["_4"] ||
                  "",
              ).trim(),
              createdAt: new Date(),
            };
          }

          await addDoc(collection(db, fullPath), docData);
          successCount++;
          if (i % 10 === 0) {
            setProgress(
              `${progressPrefix}Uploading ${successCount}/${data.length}...`,
            );
          }
        } catch (e) {
          console.error("Upload failed", e);
          failCount++;
        }
      }

      console.log(
        `[Upload] Day ${day}: Success ${successCount}, Failed ${failCount}`,
      );
    },
    [selectedCourse],
  );

  const handleBatchSheetImport = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      for (let i = 0; i < sheetItems.length; i++) {
        const item = sheetItems[i];
        const progressPrefix = `[${i + 1}/${sheetItems.length}] Day ${item.day}: `;
        setProgress(`${progressPrefix}Fetching from Sheets...`);

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${item.sheetId}/values/${item.range}?majorDimension=ROWS`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await response.json();

        if (json.error) {
          throw new Error(
            `Sheet Error (Day ${item.day}): ${json.error.message}`,
          );
        }

        const rows = json.values;
        if (!rows || rows.length < 2) {
          throw new Error(
            `No data found for Day ${item.day} or only header row exists.`,
          );
        }

        const dataObjects = parseSheetValues(rows);
        await uploadData(dataObjects, item.day, progressPrefix);
      }

      setLoading(false);
      setProgress("");
      setSheetItems([{ id: "1", day: "", sheetId: "", range: "Sheet1!A:E" }]);
      Alert.alert("Success", "All sheets imported successfully!");
    } catch (err: any) {
      console.error("[Sheets] Error:", err);
      Alert.alert("Import Error", err.message);
      setLoading(false);
    }
  }, [token, sheetItems, uploadData]);

  useEffect(() => {
    if (waitingForToken && token) {
      setWaitingForToken(false);
      handleBatchSheetImport();
    }
  }, [token, waitingForToken, handleBatchSheetImport]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Import Vocabulary",
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: isDark ? "#fff" : "#000",
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.content}>
          <AddVocaHeader
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            isDark={isDark}
            courses={COURSES}
          />

          {/* Tab Switcher */}
          <TabSwitcher
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDark={isDark}
          />

          {/* Tab Content */}
          {activeTab === "csv" ? (
            <UploadCSVFileView
              items={csvItems}
              setItems={setCsvItems}
              loading={loading}
              progress={progress}
              isDark={isDark}
              onPickDocument={handlePickDocument}
              onUpload={handleBatchUpload}
            />
          ) : (
            <UploadViaLinkView
              items={sheetItems}
              setItems={setSheetItems}
              loading={loading}
              progress={progress}
              isDark={isDark}
              token={token}
              waitingForToken={waitingForToken}
              onImport={handleSheetImportButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    header: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    headerTitle: {
      color: isDark ? "#fff" : "#000",
    },
    content: {
      padding: 20,
    },
  });
