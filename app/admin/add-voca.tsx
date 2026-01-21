import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Stack } from "expo-router";
import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddVocaHeader from "../../src/components/admin/AddVocaHeader";
import UploadCSVFileView from "../../src/components/admin/UploadCSVFileView";
import UploadViaLinkView from "../../src/components/admin/UploadViaLinkView";
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
  ];

  // State
  const [activeTab, setActiveTab] = useState<TabType>("csv");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [subcollectionName, setSubcollectionName] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Google Sheets integration
  const { token, promptAsync } = useGoogleSheetsAuth();
  const [sheetId, setSheetId] = useState("");
  const [sheetRange, setSheetRange] = useState("Sheet1!A:E");
  const [waitingForToken, setWaitingForToken] = useState(false);

  useEffect(() => {
    if (waitingForToken && token) {
      setWaitingForToken(false);
      handleFetchSheetData();
    }
  }, [token, waitingForToken]);

  const fullPath = `${selectedCourse.path}/Day${subcollectionName}`;

  // CSV Handlers
  const handlePickDocument = async () => {
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
      setSelectedFile(file);
      console.log("[Picker] File selected:", file.name);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a CSV file first");
      return;
    }

    if (!subcollectionName.trim()) {
      Alert.alert("Error", "Please enter a day number (e.g. 1, 2, 3)");
      return;
    }

    try {
      setLoading(true);

      // 1. Upload CSV to Storage
      setProgress("Checking if CSV exists in Storage...");
      const storageRef = ref(
        storage,
        `csv/${selectedCourse.name}/Day${subcollectionName}.csv`,
      );

      try {
        await getMetadata(storageRef);
        setProgress("File exists, replacing with new CSV...");
      } catch (error: any) {
        if (error.code === "storage/object-not-found") {
          console.log("[Storage] File does not exist, uploading new file");
        }
      }

      setProgress("Uploading CSV to Storage...");
      try {
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        console.log("[Storage] CSV uploaded successfully");
      } catch (storageError: any) {
        console.error("[Storage] Upload failed:", storageError);
        Alert.alert(
          "Warning",
          "Failed to save CSV to storage, but proceeding with data upload.",
        );
      }

      // 2. Read and Parse
      setProgress("Reading file...");
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);

      setProgress("Parsing CSV...");
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("[Picker] Parsed", results.data.length, "records");
          try {
            await uploadData(results.data);
          } catch (uploadError: any) {
            console.error("[Picker] Upload failed:", uploadError);
            setLoading(false);
            Alert.alert(
              "Upload Error",
              uploadError.message || "Failed to upload data",
            );
          }
        },
        error: (error: any) => {
          setLoading(false);
          Alert.alert("Error parsing CSV", error.message);
        },
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  };

  // Google Sheets Handlers
  const handleSheetImportButton = async () => {
    if (!subcollectionName.trim()) {
      Alert.alert("Error", "Please enter a day number first (e.g. 1)");
      return;
    }
    if (!sheetId.trim()) {
      Alert.alert("Error", "Please enter a Google Sheet ID");
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
      handleFetchSheetData();
    }
  };

  const handleFetchSheetData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setProgress("Fetching data from Google Sheets...");

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?majorDimension=ROWS`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message);
      }

      const rows = json.values;
      if (!rows || rows.length < 2) {
        throw new Error("No data found or only header row exists.");
      }

      const dataObjects = parseSheetValues(rows);
      await uploadData(dataObjects);
    } catch (err: any) {
      console.error("[Sheets] Error:", err);
      Alert.alert("Sheet Import Error", err.message);
      setLoading(false);
    }
  };

  // Shared upload logic
  const uploadData = async (data: any[]) => {
    if (!subcollectionName.trim()) {
      Alert.alert("Error", "Please enter a Subcollection Name (e.g. Day1)");
      setLoading(false);
      return;
    }

    // Clear existing data
    setProgress(`Clearing existing data in ${subcollectionName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, fullPath));
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref),
      );
      await Promise.all(deletePromises);
    } catch (deleteError) {
      Alert.alert("Error", "Failed to clear existing data. Aborting upload.");
      setLoading(false);
      return;
    }

    // Upload new data
    setProgress(
      `Found ${data.length} records. Uploading to ${subcollectionName}...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        const word = String(
          item["Word"] || item["word"] || item["_1"] || "",
        ).trim();

        if (word === "Word" || !word) continue;

        const docData = {
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

        await addDoc(collection(db, fullPath), docData);
        successCount++;
        setProgress(`Uploaded ${successCount}/${data.length}...`);
      } catch (e) {
        console.error("Upload failed", e);
        failCount++;
      }
    }

    setLoading(false);
    setProgress("");
    Alert.alert(
      "Upload Complete",
      `Successfully uploaded: ${successCount}\nFailed: ${failCount}`,
    );
  };

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
            subcollectionName={subcollectionName}
            setSubcollectionName={setSubcollectionName}
            isDark={isDark}
            courses={COURSES}
          />

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "csv" && styles.tabActive]}
              onPress={() => setActiveTab("csv")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "csv" && styles.tabTextActive,
                ]}
              >
                Upload CSV File
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "link" && styles.tabActive]}
              onPress={() => setActiveTab("link")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "link" && styles.tabTextActive,
                ]}
              >
                Upload via Link
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "csv" ? (
            <UploadCSVFileView
              selectedFile={selectedFile}
              loading={loading}
              progress={progress}
              isDark={isDark}
              onPickDocument={handlePickDocument}
              onUpload={handleUpload}
            />
          ) : (
            <UploadViaLinkView
              sheetId={sheetId}
              setSheetId={setSheetId}
              sheetRange={sheetRange}
              setSheetRange={setSheetRange}
              loading={loading}
              progress={progress}
              isDark={isDark}
              token={token}
              waitingForToken={waitingForToken}
              onSheetImport={handleSheetImportButton}
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
    tabContainer: {
      flexDirection: "row",
      marginBottom: 24,
      borderRadius: 10,
      backgroundColor: isDark ? "#1c1c1e" : "#e5e5ea",
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: "#007AFF",
    },
    tabText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#8e8e93" : "#6e6e73",
    },
    tabTextActive: {
      color: "#fff",
    },
  });
