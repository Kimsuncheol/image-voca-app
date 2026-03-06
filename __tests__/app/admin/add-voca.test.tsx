import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as FileSystem from "expo-file-system/legacy";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { getMetadata, uploadBytes } from "firebase/storage";
import Papa from "papaparse";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import AddVocaScreen from "../../../app/admin/add-voca";
import { generateLinguisticData } from "../../../src/services/linguisticDataService";
import { updateCourseMetadata } from "../../../src/services/vocabularyPrefetch";

const mockRouterPush = jest.fn();
const mockConsumeResult = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    back: jest.fn(),
    push: mockRouterPush,
    replace: jest.fn(),
  }),
}));

jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => "collection-ref"),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(() => ({
    empty: true,
    docs: [],
  })),
}));

jest.mock("firebase/storage", () => ({
  getMetadata: jest.fn(),
  ref: jest.fn(() => "storage-ref"),
  uploadBytes: jest.fn(),
}));

jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

jest.mock("../../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../../../src/context/UploadContext", () => ({
  useUploadContext: () => ({
    consumeResult: mockConsumeResult,
  }),
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
  generateExampleSentence: jest.fn(),
  isExampleValid: jest.fn(() => true),
}));

jest.mock("../../../src/services/ipa/wiktionaryIpaService", () => ({
  getIpaUSUK: jest.fn(() =>
    Promise.resolve({ source: "wiktionary", us: "/test/", uk: "/test/" }),
  ),
}));

jest.mock("../../../src/services/linguisticDataService", () => ({
  generateLinguisticData: jest.fn(() =>
    Promise.resolve({
      success: true,
      partOfSpeech: "noun",
      synonyms: [],
      antonyms: [],
      relatedWords: [],
      wordForms: null,
    }),
  ),
}));

jest.mock("../../../src/services/vocabularyPrefetch", () => ({
  updateCourseMetadata: jest.fn(),
}));

jest.mock("../../../src/utils/googleSheetsUtils", () => ({
  parseSheetValues: jest.fn(() => []),
}));

jest.mock("../../../src/utils/vocaParser", () => ({
  extractVocaFields: jest.fn((raw) => ({
    type: "vocabulary",
    word: raw.word,
    meaning: raw.meaning,
    translation: raw.translation,
    pronunciation: raw.pronunciation,
    example: raw.example,
  })),
}));

jest.mock("../../../src/components/admin/AddVocaHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockAddVocaHeader({ selectedCourse }: any) {
    return <Text testID="selected-course">{selectedCourse.name}</Text>;
  };
});

jest.mock("../../../src/components/admin/TabSwitcher", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");

  return function MockTabSwitcher({ activeTab, setActiveTab }: any) {
    return (
      <View testID="tab-switcher">
        <Text testID="active-tab-label">{activeTab}</Text>
        <TouchableOpacity
          testID="switch-to-csv"
          onPress={() => setActiveTab("csv")}
        >
          <Text>CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="switch-to-link"
          onPress={() => setActiveTab("link")}
        >
          <Text>Link</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../../src/components/admin/AddAnotherButton", () => {
  const React = require("react");
  const { Text, TouchableOpacity } = require("react-native");

  return function MockAddAnotherButton({ onPress, text, disabled }: any) {
    return (
      <TouchableOpacity
        testID="add-item-button"
        disabled={disabled}
        onPress={onPress}
      >
        <Text>{text}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("../../../src/components/admin/UploadListSection", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  return function MockUploadListSection({ type, items }: any) {
    return (
      <View testID="upload-list-section">
        <Text testID="upload-list-summary">{`${type}:${items.length}`}</Text>
      </View>
    );
  };
});

jest.mock("../../../src/components/admin/UploadFooter", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");

  return function MockUploadFooter({ onPress, disabled, text }: any) {
    return (
      <View>
        <Text testID="upload-footer-label">{text}</Text>
        <TouchableOpacity
          testID="upload-footer-button"
          disabled={disabled}
          onPress={onPress}
        >
          <Text>{disabled ? "disabled" : "enabled"}</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock("../../../src/components/admin/UploadProgressModal", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockUploadProgressModal({ visible, progress }: any) {
    return visible ? <Text testID="upload-progress">{progress}</Text> : null;
  };
});

function buildCsvResult() {
  return {
    mode: "add",
    type: "csv",
    item: {
      id: "csv-1",
      day: "3",
      file: {
        name: "test.csv",
        uri: "file://path/to/test.csv",
      },
    },
  };
}

describe("AddVocaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockConsumeResult.mockReturnValue(null);
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    global.fetch = jest.fn(async () => ({
      blob: async () => new Blob(["csv"]),
      json: async () => ({ values: [] }),
    })) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the current course and switches tabs", () => {
    const screen = render(<AddVocaScreen />);

    expect(screen.getByTestId("selected-course").props.children).toBe("CSAT");
    expect(screen.getByTestId("active-tab-label").props.children).toBe("csv");
    expect(screen.getByTestId("upload-footer-label").props.children).toBe(
      "Upload 0 Item(s)",
    );

    fireEvent.press(screen.getByTestId("switch-to-link"));

    expect(screen.getByTestId("active-tab-label").props.children).toBe("link");
    expect(screen.getByTestId("upload-footer-label").props.children).toBe(
      "Import 0 Item(s)",
    );
  });

  it("opens the upload-item route for the active tab", () => {
    const screen = render(<AddVocaScreen />);

    fireEvent.press(screen.getByTestId("add-item-button"));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: "/admin/upload-item",
      params: { type: "csv", mode: "add" },
    });

    fireEvent.press(screen.getByTestId("switch-to-link"));
    fireEvent.press(screen.getByTestId("add-item-button"));
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: "/admin/upload-item",
      params: { type: "link", mode: "add" },
    });
  });

  it("consumes upload context results and enables CSV upload", async () => {
    mockConsumeResult.mockReturnValueOnce(buildCsvResult());

    const screen = render(<AddVocaScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("upload-list-summary").props.children).toBe(
        "csv:1",
      );
      expect(screen.getByTestId("upload-footer-label").props.children).toBe(
        "Upload 1 Item(s)",
      );
      expect(screen.getByText("enabled")).toBeTruthy();
    });
  });

  it("uploads parsed CSV items and updates course metadata", async () => {
    mockConsumeResult.mockReturnValueOnce(buildCsvResult());
    (getMetadata as jest.Mock).mockRejectedValue(new Error("not found"));
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue("csv-content");
    (uploadBytes as jest.Mock).mockResolvedValue(undefined);
    (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
    (addDoc as jest.Mock).mockResolvedValue(undefined);
    (collection as jest.Mock).mockReturnValue("collection-ref");
    (generateLinguisticData as jest.Mock).mockResolvedValue({
      success: false,
      error: "skip AI delay",
      partOfSpeech: null,
      synonyms: [],
      antonyms: [],
      relatedWords: [],
      wordForms: null,
    });
    (Papa.parse as jest.Mock).mockImplementation(
      (_content: string, config: { complete: (results: { data: any[] }) => void }) => {
        config.complete({
          data: [
            {
              word: "seed",
              meaning: "씨앗",
              translation: "seed",
              pronunciation: "",
              example: "A farmer plants a seed.",
            },
          ],
        });
      },
    );

    const screen = render(<AddVocaScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("upload-footer-label").props.children).toBe(
        "Upload 1 Item(s)",
      );
    });

    fireEvent.press(screen.getByTestId("upload-footer-button"));

    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        "collection-ref",
        expect.objectContaining({
          word: "seed",
          meaning: "씨앗",
          translation: "seed",
          partOfSpeech: null,
        }),
      );
      expect(generateLinguisticData).toHaveBeenCalled();
      expect(updateCourseMetadata).toHaveBeenCalledWith("수능", 3);
    });
  });
});
