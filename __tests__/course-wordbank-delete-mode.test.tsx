import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { setDoc } from "firebase/firestore";
import React, * as ReactModule from "react";
import { Alert } from "react-native";
import CourseWordBankScreen from "../app/courses/[course]";

jest.mock("react", () => {
  const actual = jest.requireActual("react");

  return {
    __esModule: true,
    ...actual,
    default: actual,
    useState: jest.fn(actual.useState),
  };
});

const mockSetWords = jest.fn();
const mockSetLoading = jest.fn();
const mockSetSplashMounted = jest.fn();
const mockSetSelectedFilter = jest.fn();
const mockSetSearchQuery = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({
    course: "TOEIC",
  }),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mock-doc-ref"),
  getDoc: jest.fn(),
  setDoc: jest.fn(async () => undefined),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../components/common/AppSplashScreen", () => ({
  AppSplashScreen: () => null,
}));

jest.mock("../components/common/FilterChips", () => ({
  FilterChips: () => null,
}));

jest.mock("../components/ads/TopInstallNativeAd", () => ({
  __esModule: true,
  TopInstallNativeAd: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-top-install-native-ad" />;
  },
}));

jest.mock("../components/course-wordbank", () => ({
  EmptyWordBankView: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-empty-word-bank-view" />;
  },
  SwipeToDeleteRow: ({
    itemId,
    onDelete,
    children,
  }: {
    itemId: string;
    onDelete: (itemId: string) => void;
    children: React.ReactNode;
  }) => {
    const React = require("react");
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        {children}
        <TouchableOpacity onPress={() => onDelete(itemId)}>
          <Text>{`Delete ${itemId}`}</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock("../components/wordbank/WordCard", () => ({
  WordCard: ({ word }: { word: { word: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return <Text>{word.word}</Text>;
  },
}));

const initialWords = [
  {
    id: "1",
    word: "abandon",
    meaning: "to leave behind",
    translation: "버리다",
    pronunciation: "/əˈbændən/",
    example: "They abandoned the plan.",
    course: "TOEIC",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    word: "retain",
    meaning: "to keep",
    translation: "유지하다",
    pronunciation: "/rɪˈteɪn/",
    example: "Retain the receipt.",
    course: "TOEIC",
    addedAt: "2026-01-01T00:00:00.000Z",
  },
];

function mockScreenState(words: typeof initialWords) {
  (ReactModule.useState as jest.Mock)
    .mockImplementationOnce(() => [words, mockSetWords])
    .mockImplementationOnce(() => [false, mockSetLoading])
    .mockImplementationOnce(() => [false, mockSetSplashMounted])
    .mockImplementationOnce(() => ["all", mockSetSelectedFilter])
    .mockImplementationOnce(() => ["", mockSetSearchQuery]);
}

describe("CourseWordBankScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders one top native ad when saved words exist", () => {
    mockScreenState(initialWords);

    const screen = render(<CourseWordBankScreen />);

    expect(screen.getByTestId("mock-top-install-native-ad")).toBeTruthy();
    expect(screen.getByText("abandon")).toBeTruthy();
    expect(screen.getByText("retain")).toBeTruthy();
  });

  it("deletes a word through the screen-level list row", async () => {
    mockScreenState(initialWords);

    const screen = render(<CourseWordBankScreen />);

    fireEvent.press(screen.getByText("Delete 1"));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith("mock-doc-ref", {
        words: [
          expect.objectContaining({
            id: "2",
            word: "retain",
          }),
        ],
      });
    });

    expect(mockSetWords).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "2",
        word: "retain",
      }),
    ]);
  });

  it("shows the existing error alert when delete fails", async () => {
    mockScreenState(initialWords);
    (setDoc as jest.Mock).mockRejectedValueOnce(new Error("write failed"));

    const screen = render(<CourseWordBankScreen />);

    fireEvent.press(screen.getByText("Delete 1"));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Failed to delete word. Please try again.",
    );
    expect(mockSetWords).not.toHaveBeenCalled();
  });

  it("hides the top native ad when the word bank is empty", () => {
    mockScreenState([]);

    const screen = render(<CourseWordBankScreen />);

    expect(screen.getByTestId("mock-empty-word-bank-view")).toBeTruthy();
    expect(screen.queryByTestId("mock-top-install-native-ad")).toBeNull();
  });
});
