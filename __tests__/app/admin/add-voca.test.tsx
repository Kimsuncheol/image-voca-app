import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { getMetadata, uploadBytes } from "firebase/storage";
import Papa from "papaparse";
import React from "react";
import { Alert } from "react-native";
import AddVocaScreen from "../../../app/admin/add-voca";
import { generateExampleSentence } from "../../../src/services/exampleGenerationService";
import { updateCourseMetadata } from "../../../src/services/vocabularyPrefetch";

// Mock dependencies
jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { UTF8: "utf8" },
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(() => ({
    empty: true,
    docs: [],
  })),
}));

jest.mock("firebase/storage", () => ({
  getMetadata: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

jest.mock("../../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../../../src/hooks/useGoogleSheetsAuth", () => ({
  __esModule: true,
  default: () => ({
    token: "mock-token",
    promptAsync: jest.fn(),
  }),
}));

jest.mock("../../../src/services/firebase", () => ({
  db: {},
  storage: {},
}));

jest.mock("../../../src/services/exampleGenerationService", () => ({
  generateExampleSentence: jest.fn(() =>
    Promise.resolve({ success: true, example: "Mock example" }),
  ),
  isExampleValid: jest.fn(() => true),
}));

jest.mock("../../../src/services/vocabularyPrefetch", () => ({
  updateCourseMetadata: jest.fn(),
}));

jest.mock("../../../src/utils/googleSheetsUtils", () => ({
  parseSheetValues: jest.fn(() => []),
}));

// Mock child components with interactive implementations
jest.mock("../../../src/components/admin/AddVocaHeader", () => "AddVocaHeader");

jest.mock("../../../src/components/admin/TabSwitcher", () => {
  const { View, Button, Text } = jest.requireActual("react-native");
  const MockTabSwitcher = ({ activeTab, setActiveTab }: any) => (
    <View testID="tab-switcher">
      <Text testID="active-tab-label">{activeTab}</Text>
      <Button
        testID="switch-to-csv"
        title="CSV"
        onPress={() => setActiveTab("csv")}
      />
      <Button
        testID="switch-to-link"
        title="Link"
        onPress={() => setActiveTab("link")}
      />
    </View>
  );
  return MockTabSwitcher;
});

jest.mock("../../../src/components/admin/UploadCSVFileView", () => {
  const { View, Button, Text, TextInput } = jest.requireActual("react-native");
  const MockUploadCSVFileView = ({
    onPickDocument,
    onUpload,
    items,
    setItems,
  }: any) => (
    <View testID="csv-view">
      <Text>CSV View</Text>
      <TextInput
        testID="day-input"
        value={items[0].day}
        onChangeText={(text: string) => {
          const newItems = [...items];
          newItems[0] = { ...newItems[0], day: text };
          setItems(newItems);
        }}
      />
      <Button
        testID="pick-csv-button"
        title="Pick CSV"
        onPress={() => onPickDocument(items[0].id)}
      />
      <Button testID="upload-csv-button" title="Upload" onPress={onUpload} />
      <Text testID="picked-file-name">
        {items[0]?.file ? items[0].file.name : "No file"}
      </Text>
    </View>
  );
  return MockUploadCSVFileView;
});

jest.mock("../../../src/components/admin/UploadViaLinkView", () => {
  const { View, Text } = jest.requireActual("react-native");
  const MockUploadViaLinkView = () => (
    <View testID="link-view">
      <Text>Link View</Text>
    </View>
  );
  return MockUploadViaLinkView;
});

describe("AddVocaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert");
  });

  it("renders correctly", () => {
    const { toJSON } = render(<AddVocaScreen />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("switches tabs correctly", () => {
    const { getByTestId, queryByTestId } = render(<AddVocaScreen />);

    // Initial state should be csv
    expect(getByTestId("active-tab-label").props.children).toBe("csv");
    expect(getByTestId("csv-view")).toBeTruthy();
    expect(queryByTestId("link-view")).toBeNull();

    // Switch to link tab
    fireEvent.press(getByTestId("switch-to-link"));

    // Check if state updated
    expect(getByTestId("active-tab-label").props.children).toBe("link");
    expect(queryByTestId("csv-view")).toBeNull();
    expect(getByTestId("link-view")).toBeTruthy();

    // Switch back to csv tab
    fireEvent.press(getByTestId("switch-to-csv"));

    // Check if state updated back
    expect(getByTestId("active-tab-label").props.children).toBe("csv");
    expect(getByTestId("csv-view")).toBeTruthy();
    expect(queryByTestId("link-view")).toBeNull();
  });

  it("handles CSV file selection correctly", async () => {
    const mockFileName = "test.csv";
    const mockFileUri = "file://path/to/test.csv";
    const mockFileType = "text/csv";

    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: mockFileName,
          uri: mockFileUri,
          mimeType: mockFileType,
          size: 100,
        },
      ],
    });

    const { getByTestId } = render(<AddVocaScreen />);

    // Ensure we are on the CSV tab
    fireEvent.press(getByTestId("switch-to-csv"));

    // Click the button to pick a CSV file
    fireEvent.press(getByTestId("pick-csv-button"));

    // Wait for the async operation to complete and the state to update
    await waitFor(() => {
      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });
      expect(getByTestId("picked-file-name").props.children).toBe(mockFileName);
    });
  });

  it("handles batch upload process for CSV file", async () => {
    const mockFileName = "vocabulary.csv";
    const mockFileUri = "file://path/to/vocabulary.csv";
    const mockFileType = "text/csv";
    const mockCsvContent =
      "word,meaning,example\nhello,greeting,Hello world\nbye,farewell,Goodbye";
    const mockParsedData = [
      { word: "hello", meaning: "greeting", example: "Hello world" },
      { word: "bye", meaning: "farewell", example: "Goodbye" },
    ];

    // Set up item with file selected
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          name: mockFileName,
          uri: mockFileUri,
          mimeType: mockFileType,
          size: 100,
        },
      ],
    });

    // Mock file content reading
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      mockCsvContent,
    );

    // Mock parsing
    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      if (config && config.complete) {
        config.complete({ data: mockParsedData, errors: [], meta: {} });
      }
    });

    // Mock Firestore interactions
    (collection as jest.Mock).mockReturnValue({});
    (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    (addDoc as jest.Mock).mockResolvedValue({ id: "new-doc-id" });
    (uploadBytes as jest.Mock).mockResolvedValue({});
    (updateCourseMetadata as jest.Mock).mockResolvedValue(undefined);
    (generateExampleSentence as jest.Mock).mockResolvedValue({
      success: true,
      example: "Generated example",
    });

    // Mock getMetadata to throw (simulate file not exists, so no overwrite prompt)
    (getMetadata as jest.Mock).mockRejectedValue(new Error("File not found"));

    // We also need to mock global fetch for uploading file to storage, since source code does fetch(item.file.uri)
    const mockFetchPromise = Promise.resolve({
      blob: () => Promise.resolve("mock-blob"),
    });
    global.fetch = jest.fn(() => mockFetchPromise) as any;

    const { getByTestId } = render(<AddVocaScreen />);

    // Ensure we are on the CSV tab
    fireEvent.press(getByTestId("switch-to-csv"));

    // 1. Pick the CSV file first (state setup)
    fireEvent.press(getByTestId("pick-csv-button"));
    await waitFor(() => {
      expect(getByTestId("picked-file-name").props.children).toBe(mockFileName);
    });

    // 2. Set the Day (Required for validation)
    fireEvent.changeText(getByTestId("day-input"), "1");

    // 3. Trigger the upload
    fireEvent.press(getByTestId("upload-csv-button"));

    // Check if Alert was called (validation failure)
    expect(Alert.alert).not.toHaveBeenCalled();

    // Wait for upload process to trigger parsing and uploading
    await waitFor(() => {
      // Should read the file
      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(mockFileUri);

      // Should parse it
      expect(Papa.parse).toHaveBeenCalledWith(
        mockCsvContent,
        expect.any(Object),
      );

      // Should clear existing data (getDocs and potentially deleteDoc)
      expect(getDocs).toHaveBeenCalled();

      // Should add docs
      expect(addDoc).toHaveBeenCalledTimes(mockParsedData.length);

      // Should update metadata
      expect(updateCourseMetadata).toHaveBeenCalled();
    });
  });
});
