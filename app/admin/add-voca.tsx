import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Stack, useRouter } from "expo-router";
import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
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
  const [subcollectionName, setSubcollectionName] = useState("CSAT1_Day1");

  // Computed full path for display/verify
  const fullPath = `${selectedCourse.path}/${subcollectionName}`;

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
      setLoading(true);

      // 1. Upload CSV to Storage
      setProgress("Uploading CSV to Storage...");
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `csv/${selectedCourse.name}/${subcollectionName}.csv`
        );
        await uploadBytes(storageRef, blob);
        console.log("CSV uploaded to storage");
      } catch (storageError: any) {
        console.error("Storage upload failed", storageError);
        Alert.alert(
          "Warning",
          "Failed to save CSV to storage, but proceeding with data upload."
        );
      }

      // 2. Read and Parse
      setProgress("Reading file...");
      const fileContent = await FileSystem.readAsStringAsync(file.uri);

      setProgress("Parsing CSV...");
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await uploadData(results.data);
        },
        error: (error) => {
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
    if (!subcollectionName.trim()) {
      Alert.alert("Error", "Please enter a Subcollection Name (e.g. Day1)");
      setLoading(false);
      return;
    }

    // 3. Clear existing data
    setProgress(`Clearing existing data in ${subcollectionName}...`);
    try {
      const querySnapshot = await getDocs(collection(db, fullPath));
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} existing documents.`);
    } catch (deleteError) {
      console.error("Failed to clear existing data", deleteError);
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
        const word = item["Word"] || item["word"];
        if (!word) continue;

        const docData = {
          word: String(word).trim(),
          meaning: String(item["Meaning"] || item["meaning"] || "").trim(),
          pronunciation: String(
            item["Pronounciation"] ||
              item["Pronunciation"] ||
              item["pronunciation"] ||
              ""
          ).trim(),
          example: String(
            item["Example sentence"] || item["Example"] || item["example"] || ""
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
      [{ text: "OK" }]
    );
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
            <Text style={styles.label}>Subcollection Name (e.g. Day1)</Text>
            <TextInput
              style={styles.input}
              value={subcollectionName}
              onChangeText={setSubcollectionName}
              placeholder="e.g. CSAT1_Day1"
              placeholderTextColor={isDark ? "#555" : "#999"}
            />
            <Text style={styles.pathHint}>
              Target: .../{selectedCourse.name}/.../{subcollectionName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDocument}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#007AFF" size="large" />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color="#007AFF"
                />
                <Text style={styles.uploadButtonText}>Select CSV File</Text>
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
    progressText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
    },
  });
