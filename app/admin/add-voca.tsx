// Expo and React Native imports
import * as DocumentPicker from "expo-document-picker"; // For selecting CSV files from device
import * as FileSystem from "expo-file-system/legacy"; // For reading file contents
import { Stack } from "expo-router"; // For navigation header configuration
import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore"; // Firestore database operations
import { getMetadata, ref, uploadBytes } from "firebase/storage"; // Firebase Storage operations
import Papa from "papaparse"; // CSV parsing library
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom components
import AddAnotherButton from "../../src/components/admin/AddAnotherButton";
import AddVocaHeader from "../../src/components/admin/AddVocaHeader"; // Course selector header
import { CsvUploadItem } from "../../src/components/admin/CsvUploadItemView";
import { SheetUploadItem } from "../../src/components/admin/GoogleSheetUploadItemView";
import TabSwitcher from "../../src/components/admin/TabSwitcher"; // Toggle between CSV and Google Sheets
import UploadFooter from "../../src/components/admin/UploadFooter";
import UploadListItem from "../../src/components/admin/UploadListItem";
import UploadModal from "../../src/components/admin/UploadModal";

// Hooks and utilities
import { useTheme } from "../../src/context/ThemeContext";
import useGoogleSheetsAuth from "../../src/hooks/useGoogleSheetsAuth"; // Google OAuth authentication
import { db, storage } from "../../src/services/firebase";
import { getIpaUSUK } from "../../src/services/ipa/wiktionaryIpaService"; // IPA pronunciation fetching
import { generateLinguisticData } from "../../src/services/linguisticDataService"; // AI linguistic data generation
import { updateCourseMetadata } from "../../src/services/vocabularyPrefetch"; // Course metadata management
import { parseSheetValues } from "../../src/utils/googleSheetsUtils";

// Type definition for tab switching
type TabType = "csv" | "link";

/**
 * Admin screen for importing vocabulary data into Firestore
 * Supports two import methods: CSV file upload and Google Sheets import
 */
export default function AddVocaScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);

  // Available courses with their Firestore collection paths
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

  const createEmptyCsvItem = (): CsvUploadItem => ({
    id: Date.now().toString(),
    day: "",
    file: null,
  });

  const createEmptySheetItem = (): SheetUploadItem => ({
    id: Date.now().toString(),
    day: "",
    sheetId: "",
    range: "Sheet1!A:E",
  });

  // === State Management ===

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("csv"); // Current active tab (CSV or Google Sheets)
  const [loading, setLoading] = useState(false); // Loading indicator during upload
  const [progress, setProgress] = useState(""); // Progress message for user feedback
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]); // Currently selected course

  // CSV upload state - single item
  const [csvItem, setCsvItem] = useState<CsvUploadItem>(() =>
    createEmptyCsvItem(),
  );

  // Google Sheets import state - single item
  const [sheetItem, setSheetItem] = useState<SheetUploadItem>(() =>
    createEmptySheetItem(),
  );

  // Google Sheets OAuth authentication
  const { token, promptAsync } = useGoogleSheetsAuth();
  const [waitingForToken, setWaitingForToken] = useState(false); // Flag for auth flow

  // Modal state for editing items
  const [modalVisible, setModalVisible] = useState(false);

  // === CSV Upload Handlers ===

  /**
   * Opens document picker for selecting CSV files
   * Updates the CSV item with selected file
   */
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
      setCsvItem((prev) => ({ ...prev, file }));
      console.log("[Picker] File selected:", file.name);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  /**
   * Checks if data already exists in Storage and/or Firestore for a given day
   */
  const checkExistingData = useCallback(
    async (
      day: string,
    ): Promise<{
      storageExists: boolean;
      firestoreExists: boolean;
    }> => {
      const storageRef = ref(
        storage,
        `csv/${selectedCourse.name}/Day${day}.csv`,
      );
      const fullPath = `${selectedCourse.path}/Day${day}`;

      let storageExists = false;
      let firestoreExists = false;

      // Check Storage
      try {
        await getMetadata(storageRef);
        storageExists = true;
      } catch (error: any) {
        // File doesn't exist
        storageExists = false;
      }

      // Check Firestore
      try {
        const querySnapshot = await getDocs(collection(db, fullPath));
        firestoreExists = !querySnapshot.empty;
      } catch (error) {
        firestoreExists = false;
      }

      return { storageExists, firestoreExists };
    },
    [selectedCourse],
  );

  /**
   * Validates and processes a single CSV upload
   * The CSV file is uploaded to Storage and parsed into Firestore
   */
  const handleBatchUpload = async () => {
    if (!csvItem.day.trim() || !csvItem.file) {
      Alert.alert(
        "Validation Error",
        "Please ensure the item has a Day and a File selected.",
      );
      return;
    }

    try {
      setLoading(true);

      const progressPrefix = `Day ${csvItem.day}: `;
      setProgress(`${progressPrefix}Checking existing data...`);

      // Check if data already exists
      const { storageExists, firestoreExists } = await checkExistingData(
        csvItem.day,
      );

      if (storageExists || firestoreExists) {
        // Show confirmation dialog and wait for user response
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Data Already Exists",
            `Day ${csvItem.day} already has data in ${storageExists && firestoreExists ? "both Storage and Firestore" : storageExists ? "Storage" : "Firestore"}. Do you want to overwrite it?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Upload",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ],
          );
        });

        if (!shouldContinue) {
          setProgress(`${progressPrefix}Skipped by user`);
          setLoading(false);
          return;
        }
      }

      setProgress(`${progressPrefix}Starting...`);
      await processCsvItem(csvItem, progressPrefix);

      setLoading(false);
      setProgress("");
      setCsvItem(createEmptyCsvItem());
      Alert.alert(
        "Success",
        "File uploaded successfully! Linguistic data (synonyms, antonyms, related words, word forms) was generated using AI.",
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  };

  /**
   * Processes a single CSV item:
   * 1. Uploads CSV file to Firebase Storage
   * 2. Reads and parses the CSV content
   * 3. Uploads parsed data to Firestore
   */
  const processCsvItem = async (
    item: CsvUploadItem,
    progressPrefix: string,
  ) => {
    // Step 1: Upload CSV file to Firebase Storage for backup
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

    // Step 2: Read file content and parse CSV using PapaParse
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

  // === Google Sheets Import Handlers ===

  /**
   * Initiates Google Sheets import
   * Validates input and triggers OAuth flow if needed
   */
  const handleSheetImportButton = async () => {
    if (!sheetItem.day.trim() || !sheetItem.sheetId.trim()) {
      Alert.alert(
        "Validation Error",
        "Please ensure the item has a Day and a Sheet ID.",
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

  // === Shared Upload Logic ===

  /**
   * Uploads vocabulary data to Firestore
   * Used by both CSV and Google Sheets import methods
   * Clears existing data for the day before uploading new data
   * Automatically generates missing example sentences using OpenAI
   */
  const uploadData = useCallback(
    async (data: any[], day: string, progressPrefix: string) => {
      const fullPath = `${selectedCourse.path}/Day${day}`;

      // Clear existing data for this day to avoid duplicates
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

      // Upload new vocabulary data to Firestore
      setProgress(`${progressPrefix}Processing ${data.length} records...`);

      let successCount = 0;
      let failCount = 0;
      let aiGeneratedCount = 0;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
          // Extract word/collocation from multiple possible column names
          const word = String(
            item["Word"] ||
              item["word"] ||
              item["_1"] ||
              item["Collocation"] ||
              item["collocation"] ||
              "",
          ).trim();

          // Skip header row or empty entries
          if (
            word === "Word" ||
            word === "word" ||
            !word ||
            word === "Collocation" ||
            word === "collocation"
          )
            continue;

          let docData: any = {};

          // Different data structure for COLLOCATION vs other courses
          if (selectedCourse.name === "COLLOCATION") {
            const meaning = String(
              item["Meaning"] || item["meaning"] || item["_2"] || "",
            ).trim();
            const explanation = String(
              item["Explanation"] || item["explanation"] || item["_3"] || "",
            ).trim();
            let example = String(
              item["Example"] || item["example"] || item["_4"] || "",
            ).trim();
            let translation = String(
              item["Translation"] || item["translation"] || item["_5"] || "",
            ).trim();

            // COLLOCATION course: Skip linguistic data generation (uses phrases, not single words)
            docData = {
              collocation: word,
              meaning,
              explanation,
              example,
              translation,
              createdAt: new Date(),
            };
          } else {
            const meaning = String(
              item["Meaning"] || item["meaning"] || item["_2"] || "",
            ).trim();
            let translation = String(
              item["Translation"] || item["translation"] || item["_5"] || "",
            ).trim();
            let pronunciation = String(
              item["Pronounciation"] ||
                item["Pronunciation"] ||
                item["pronunciation"] ||
                item["_3"] ||
                "",
            ).trim();
            let example = String(
              item["Example sentence"] ||
                item["Example"] ||
                item["example"] ||
                item["_4"] ||
                "",
            ).trim();

            // Fetch IPA from Wiktionary if pronunciation is missing
            // Only for single words (not collocations/phrases)
            if (!pronunciation && word && !word.includes(" ")) {
              try {
                setProgress(
                  `${progressPrefix}Fetching IPA for "${word}" (${i + 1}/${data.length})...`,
                );
                const ipaResult = await getIpaUSUK(word);
                if (ipaResult.source === "wiktionary") {
                  // Combine US and UK pronunciations if both available
                  if (ipaResult.us && ipaResult.uk) {
                    pronunciation = `US: ${ipaResult.us} | UK: ${ipaResult.uk}`;
                  } else if (ipaResult.us) {
                    pronunciation = ipaResult.us;
                  } else if (ipaResult.uk) {
                    pronunciation = ipaResult.uk;
                  }
                  console.log(
                    `[IPA] Fetched pronunciation for "${word}":`,
                    pronunciation,
                  );
                }
              } catch (ipaError) {
                console.warn(`[IPA] Failed to fetch for "${word}":`, ipaError);
                // Continue without pronunciation - non-blocking
              }
            }

            // Generate linguistic data (synonyms, antonyms, related words, word forms)
            setProgress(
              `${progressPrefix}Generating linguistic data for "${word}" (${i + 1}/${data.length})...`,
            );
            const linguisticData = await generateLinguisticData({
              word,
              meaning,
              courseLevel: selectedCourse.name as any,
            });

            if (linguisticData.success) {
              aiGeneratedCount++;
              console.log(
                `[AI] Generated linguistic data for "${word}":`,
                linguisticData,
              );
            } else {
              console.warn(
                `[AI] Failed to generate linguistic data for "${word}":`,
                linguisticData.error,
              );
            }

            docData = {
              word: word,
              meaning,
              translation,
              pronunciation,
              example: example || "", // Keep for backward compatibility
              createdAt: new Date(),
              // Linguistic data fields
              partOfSpeech: linguisticData.success
                ? linguisticData.partOfSpeech
                : null,
              synonyms: linguisticData.success ? linguisticData.synonyms : [],
              antonyms: linguisticData.success ? linguisticData.antonyms : [],
              relatedWords: linguisticData.success
                ? linguisticData.relatedWords
                : [],
              wordForms: linguisticData.success
                ? linguisticData.wordForms
                : null,
            };
          }

          await addDoc(collection(db, fullPath), docData);
          successCount++;
          if (i % 5 === 0) {
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
        `[Upload] Day ${day}: Success ${successCount}, Failed ${failCount}, AI Generated ${aiGeneratedCount}`,
      );

      // Show summary if AI generated linguistic data
      if (aiGeneratedCount > 0) {
        setProgress(
          `${progressPrefix}Completed! (${aiGeneratedCount} words processed by AI)`,
        );
        // Wait a bit so user can see the message
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Update course metadata with the total number of days
      // This allows the app to know how many days are available for each course
      if (successCount > 0) {
        try {
          // Get the course ID from the selected course name
          const courseIdMap: Record<string, string> = {
            CSAT: "수능",
            IELTS: "IELTS",
            TOEFL: "TOEFL",
            TOEIC: "TOEIC",
            COLLOCATION: "COLLOCATION",
          };

          const courseId = courseIdMap[selectedCourse.name];
          if (courseId) {
            await updateCourseMetadata(courseId as any, parseInt(day, 10));
            console.log(`[Metadata] Updated ${courseId} with day ${day}`);
          }
        } catch (metadataError) {
          console.error("[Metadata] Failed to update:", metadataError);
          // Don't throw - metadata update failure shouldn't fail the upload
        }
      }
    },
    [selectedCourse],
  );

  /**
   * Fetches data from Google Sheets and uploads to Firestore
   * Requires valid OAuth token
   */
  const handleBatchSheetImport = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const progressPrefix = `Day ${sheetItem.day}: `;
      setProgress(`${progressPrefix}Checking existing data...`);

      // Check if data already exists
      const { storageExists, firestoreExists } = await checkExistingData(
        sheetItem.day,
      );

      if (storageExists || firestoreExists) {
        // Show confirmation dialog and wait for user response
        const shouldContinue = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Data Already Exists",
            `Day ${sheetItem.day} already has data in ${storageExists && firestoreExists ? "both Storage and Firestore" : storageExists ? "Storage" : "Firestore"}. Do you want to overwrite it?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Upload",
                style: "destructive",
                onPress: () => resolve(true),
              },
            ],
          );
        });

        if (!shouldContinue) {
          setProgress(`${progressPrefix}Skipped by user`);
          setLoading(false);
          return;
        }
      }

      setProgress(`${progressPrefix}Fetching from Sheets...`);

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetItem.sheetId}/values/${sheetItem.range}?majorDimension=ROWS`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(
          `Sheet Error (Day ${sheetItem.day}): ${json.error.message}`,
        );
      }

      const rows = json.values;
      if (!rows || rows.length < 2) {
        throw new Error(
          `No data found for Day ${sheetItem.day} or only header row exists.`,
        );
      }

      const dataObjects = parseSheetValues(rows);
      await uploadData(dataObjects, sheetItem.day, progressPrefix);

      setLoading(false);
      setProgress("");
      setSheetItem(createEmptySheetItem());
      Alert.alert(
        "Success",
        "All sheets imported successfully! Linguistic data (synonyms, antonyms, related words, word forms) was generated using AI.",
      );
    } catch (err: any) {
      console.error("[Sheets] Error:", err);
      Alert.alert("Import Error", err.message);
      setLoading(false);
    }
  }, [token, sheetItem, uploadData, checkExistingData]);

  // Trigger import automatically after OAuth authentication completes
  useEffect(() => {
    if (waitingForToken && token) {
      setWaitingForToken(false);
      handleBatchSheetImport();
    }
  }, [token, waitingForToken, handleBatchSheetImport]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Stack.Screen
        options={{
          title: "Import Vocabulary",
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: isDark ? "#fff" : "#000",
        }}
      />

      <View style={{ flex: 1 }}>
        <View style={styles.topSection}>
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
        </View>

        {/* Add Button (Fixed) */}
        <View style={styles.addButtonContainer}>
          <AddAnotherButton
            onPress={() => {
              setModalVisible(true);
            }}
            disabled={loading}
            text={activeTab === "csv" ? "Edit CSV" : "Edit Link"}
            borderColor={activeTab === "csv" ? "#007AFF" : "#0F9D58"}
            fontColor={activeTab === "csv" ? "#007AFF" : "#0F9D58"}
          />
        </View>

        {/* Item Summary */}
        <View style={styles.listContent}>
          <UploadListItem
            type={activeTab}
            item={activeTab === "csv" ? csvItem : sheetItem}
            index={0}
            onPress={() => setModalVisible(true)}
            onDelete={() => {}}
            showDelete={false}
            isDark={isDark}
          />
        </View>

        {/* Upload Modal */}
        <UploadModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          modalType={activeTab}
          isDark={isDark}
          csvItem={csvItem}
          setCsvItem={setCsvItem}
          onPickDocument={handlePickDocument}
          sheetItem={sheetItem}
          setSheetItem={setSheetItem}
          loading={loading}
        />

        {/* Upload Footer - below the list */}
        <UploadFooter
          onPress={
            activeTab === "csv" ? handleBatchUpload : handleSheetImportButton
          }
          loading={loading}
          disabled={loading}
          text={
            activeTab === "csv"
              ? `Upload ${csvItem.file && csvItem.day ? 1 : 0} Item(s)`
              : token
                ? `Import ${sheetItem.sheetId && sheetItem.day ? 1 : 0} Item(s)`
                : "Connect & Import"
          }
          iconName={activeTab === "csv" ? "cloud-upload" : "grid"}
          backgroundColor={activeTab === "link" ? "#0F9D58" : undefined}
          isDark={isDark}
        />
      </View>

      {/* Upload Progress Modal */}
      <Modal
        visible={loading}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.modalTitle}>Uploading...</Text>
            {progress ? (
              <Text style={styles.modalMessage}>{progress}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Dynamic styles based on theme (dark/light mode)
 */
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
    topSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 12,
      padding: 24,
      minWidth: 280,
      maxWidth: "80%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginTop: 16,
      marginBottom: 8,
    },
    modalMessage: {
      fontSize: 14,
      color: isDark ? "#a0a0a0" : "#666",
      textAlign: "center",
      lineHeight: 20,
    },
    addButtonContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
  });
