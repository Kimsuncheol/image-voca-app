import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Stack, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import Papa from "papaparse";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { db, storage } from "../../src/services/firebase";

export default function AddVocaScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const styles = getStyles(isDark);

  const COURSES = [
    { name: "CSAT", path: process.env.EXPO_PUBLIC_COURSE_PATH_CSAT || "" },
    { name: "IELTS", path: process.env.EXPO_PUBLIC_COURSE_PATH_IELTS || "" },
    { name: "OPIc", path: process.env.EXPO_PUBLIC_COURSE_PATH_OPIC || "" },
    { name: "TOEFL", path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL || "" },
    { name: "TOEIC", path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC || "" },
    {
      name: "TOEIC Speaking",
      path: process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING || "",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [subcollectionName, setSubcollectionName] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Computed full path for display/verify - now with Day prefix added
  const fullPath = `${selectedCourse.path}/Day${subcollectionName}`;

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
        `csv/${selectedCourse.name}/Day${subcollectionName}.csv`
      );

      try {
        const metadata = await getMetadata(storageRef);
        console.log("[Storage] File already exists:", metadata.name);
        console.log("[Storage] Size:", metadata.size, "bytes");
        console.log("[Storage] Updated:", metadata.updated);
        setProgress("File exists, replacing with new CSV...");
      } catch (error: any) {
        if (error.code === "storage/object-not-found") {
          console.log("[Storage] File does not exist, uploading new file");
        } else {
          console.error("[Storage] Error checking file:", error);
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
          "Failed to save CSV to storage, but proceeding with data upload."
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
          console.log("[Picker] First 3 records:", results.data.slice(0, 3));
          console.log("[Picker] All parsed data:", results.data);
          try {
            await uploadData(results.data);
          } catch (uploadError: any) {
            console.error("[Picker] Upload failed:", uploadError);
            setLoading(false);
            Alert.alert(
              "Upload Error",
              uploadError.message || "Failed to upload data"
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

  const uploadData = async (data: any[]) => {
    console.log("[Upload] Starting uploadData with", data.length, "records");
    if (!subcollectionName.trim()) {
      Alert.alert("Error", "Please enter a Subcollection Name (e.g. Day1)");
      setLoading(false);
      return;
    }

    console.log("[Upload] Target Firestore path:", fullPath);

    // 3. Clear existing data
    setProgress(`Clearing existing data in ${subcollectionName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, fullPath));
      console.log(
        "[Upload] Found",
        querySnapshot.docs.length,
        "existing documents to delete"
      );
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      console.log(
        `[Upload] Deleted ${deletePromises.length} existing documents.`
      );
    } catch (deleteError) {
      console.error("[Upload] Failed to clear existing data:", deleteError);
      Alert.alert("Error", "Failed to clear existing data. Aborting upload.");
      setLoading(false);
      return;
    }

    // 4. Upload new data
    setProgress(
      `Found ${data.length} records. Uploading to ${subcollectionName}...`
    );

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      try {
        // Handle both renamed headers (_1, _2, _3, _4) and standard headers
        const word = String(
          item["Word"] || item["word"] || item["_1"] || ""
        ).trim();

        // Skip if this is the actual header row (when first line was empty)
        if (word === "Word" || !word) continue;

        const docData = {
          word: word,
          meaning: String(
            item["Meaning"] || item["meaning"] || item["_2"] || ""
          ).trim(),
          pronunciation: String(
            item["Pronounciation"] ||
              item["Pronunciation"] ||
              item["pronunciation"] ||
              item["_3"] ||
              ""
          ).trim(),
          example: String(
            item["Example sentence"] ||
              item["Example"] ||
              item["example"] ||
              item["_4"] ||
              ""
          ).trim(),
          createdAt: new Date(),
        };

        await addDoc(collection(db, fullPath), docData);
        successCount++;
        if (successCount === 1 || successCount % 10 === 0) {
          console.log(`[Upload] Progress: ${successCount}/${data.length}`);
        }
        setProgress(`Uploaded ${successCount}/${data.length}...`);
      } catch (e) {
        console.error("Upload failed", e);
        failCount++;
      }
    }

    // 5. Verify data was saved - fetch and display
    console.log("[Verify] Fetching saved data from Firestore...");
    try {
      const verifySnapshot = await getDocs(collection(db, fullPath));
      console.log(
        "[Verify] Total documents in Firestore:",
        verifySnapshot.docs.length
      );
      console.log(
        "[Verify] First 3 documents:",
        verifySnapshot.docs.slice(0, 3).map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      console.log(
        "[Verify] All documents:",
        verifySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (verifyError) {
      console.error("[Verify] Failed to verify saved data:", verifyError);
    }

    setLoading(false);
    setProgress("");
    Alert.alert(
      "Upload Complete",
      `Successfully uploaded: ${successCount}\nFailed: ${failCount}`,
      [{ text: "OK" }]
    );
  };

  const handleImportFromAsset = async () => {
    try {
      setLoading(true);
      setProgress("Loading CSV from assets...");
      console.log("[Import] Starting import from asset");
      console.log("[Import] Target path:", fullPath);

      // Load the predefined CSV file from assets
      const csvAsset = Asset.fromModule(
        require("../../assets/spreadsheet/CSAT_Day1.csv")
      );
      await csvAsset.downloadAsync();
      console.log("[Import] CSV asset downloaded:", csvAsset.localUri);

      if (!csvAsset.localUri) {
        throw new Error("Failed to load CSV asset");
      }

      // 1. Check if file exists in Storage, then upload CSV
      setProgress("Checking if CSV exists in Storage...");
      const storageRef = ref(
        storage,
        `csv/${selectedCourse.name}/${subcollectionName}.csv`
      );

      try {
        const metadata = await getMetadata(storageRef);
        console.log("[Storage] File already exists:", metadata.name);
        console.log("[Storage] Size:", metadata.size, "bytes");
        console.log("[Storage] Updated:", metadata.updated);
        setProgress("File exists, replacing with new CSV...");
      } catch (error: any) {
        if (error.code === "storage/object-not-found") {
          console.log("[Storage] File does not exist, uploading new file");
        } else {
          console.error("[Storage] Error checking file:", error);
        }
      }

      setProgress("Uploading CSV to Storage...");
      try {
        const response = await fetch(csvAsset.localUri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        console.log("[Storage] CSV uploaded successfully");
      } catch (storageError: any) {
        console.error("[Storage] Upload failed:", storageError);
        Alert.alert(
          "Warning",
          "Failed to save CSV to storage, but proceeding with data upload."
        );
      }

      // 2. Read and Parse
      setProgress("Reading file...");
      const fileContent = await FileSystem.readAsStringAsync(csvAsset.localUri);
      console.log("[Import] File content length:", fileContent.length);

      setProgress("Parsing CSV...");
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("[Import] Parsed", results.data.length, "records");
          console.log("[Import] First 3 records:", results.data.slice(0, 3));
          console.log("[Import] All parsed data:", results.data);
          try {
            await uploadData(results.data);
          } catch (uploadError: any) {
            console.error("[Import] Upload failed:", uploadError);
            setLoading(false);
            Alert.alert(
              "Upload Error",
              uploadError.message || "Failed to upload data"
            );
          }
        },
        error: (error: any) => {
          console.error("[Import] CSV parsing error:", error);
          setLoading(false);
          Alert.alert("Error parsing CSV", error.message);
        },
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
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
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={isDark ? "#eee" : "#333"}
            />
            <Text style={styles.infoText}>
              Select a Course and define the day/unit (e.g., Day1).{"\n"}
              Then upload your CSV.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Course</Text>
            <View style={styles.courseContainer}>
              {COURSES.map((course) => (
                <TouchableOpacity
                  key={course.name}
                  style={[
                    styles.courseButton,
                    selectedCourse.name === course.name &&
                      styles.courseButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCourse(course);
                    // Optional: Reset or auto-suggest subcollection name based on course?
                    // For now keep it manual or preserve.
                    if (
                      course.name === "CSAT" &&
                      subcollectionName.startsWith("CSAT")
                    )
                      return;
                    // Simple heuristic to clear if switching types completely, strictly optional.
                  }}
                >
                  <Text
                    style={[
                      styles.courseButtonText,
                      selectedCourse.name === course.name &&
                        styles.courseButtonTextActive,
                    ]}
                  >
                    {course.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subcollection Name</Text>
            <View style={styles.dayInputContainer}>
              <View style={styles.dayPrefix}>
                <Text style={styles.dayPrefixText}>Day</Text>
              </View>
              <TextInput
                style={styles.dayInput}
                value={subcollectionName}
                onChangeText={setSubcollectionName}
                placeholder="1"
                placeholderTextColor={isDark ? "#555" : "#999"}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.pathHint}>
              Target: .../{selectedCourse.name}/.../Day{subcollectionName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDocument}
            disabled={loading}
          >
            <>
              <Ionicons
                name="document-attach-outline"
                size={32}
                color="#007AFF"
              />
              <Text style={styles.uploadButtonText}>
                {selectedFile ? selectedFile.name : "Select CSV File"}
              </Text>
            </>
          </TouchableOpacity>

          {selectedFile && (
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonPrimary]}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={32}
                    color="#fff"
                  />
                  <Text
                    style={[
                      styles.uploadButtonText,
                      styles.uploadButtonTextPrimary,
                    ]}
                  >
                    Upload
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportFromAsset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="cloud-download-outline"
                  size={24}
                  color="#fff"
                />
                <Text style={styles.importButtonText}>Import</Text>
              </>
            )}
          </TouchableOpacity>

          {loading && <Text style={styles.progressText}>{progress}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    infoBox: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      alignItems: "center",
    },
    infoText: {
      color: isDark ? "#e5e5e7" : "#333",
      marginLeft: 12,
      flex: 1,
      lineHeight: 20,
    },
    inputGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
      color: isDark ? "#8e8e93" : "#6e6e73",
      textTransform: "uppercase",
      marginLeft: 4,
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 15,
      borderRadius: 10,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
    },
    dayInputContainer: {
      flexDirection: "row",
      alignItems: "stretch",
      marginBottom: 8,
    },
    dayPrefix: {
      backgroundColor: "#0b51e6",
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    dayPrefixText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    dayInput: {
      flex: 1,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      paddingVertical: 15,
      paddingHorizontal: 15,
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "#38383a" : "#c6c6c8",
      borderLeftWidth: 0,
    },
    pathInput: {
      fontSize: 12,
      color: isDark ? "#aaa" : "#666",
      height: 80,
      textAlignVertical: "top",
    },
    courseContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    courseButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: isDark ? "#2c2c2e" : "#e5e5ea",
      marginBottom: 8,
    },
    courseButtonActive: {
      backgroundColor: "#007AFF",
    },
    courseButtonText: {
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
    },
    courseButtonTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    pathHint: {
      fontSize: 12,
      color: isDark ? "#8e8e93" : "#6e6e73",
      marginTop: 6,
      fontStyle: "italic",
    },
    uploadButton: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      padding: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#007AFF",
      borderStyle: "dashed",
    },
    uploadButtonText: {
      color: "#007AFF",
      fontSize: 18,
      fontWeight: "600",
      marginTop: 12,
    },
    uploadButtonPrimary: {
      backgroundColor: "#007AFF",
      borderStyle: "solid",
    },
    uploadButtonTextPrimary: {
      color: "#fff",
    },
    progressText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
    },
    importButton: {
      backgroundColor: "#007AFF",
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      marginTop: 16,
      gap: 8,
    },
    importButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
