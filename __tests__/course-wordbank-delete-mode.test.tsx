import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
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
const mockSetSelectedFilter = jest.fn();

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
  setDoc: jest.fn(),
}));

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

jest.mock("../components/common/FilterChips", () => ({
  FilterChips: () => null,
}));

jest.mock("../components/course-wordbank", () => ({
  EmptyWordBankView: () => null,
  SkeletonList: () => null,
  WordList: ({
    words,
    onDeleteWord,
  }: {
    words: { id: string; word: string }[];
    onDeleteWord: (wordId: string) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <Text>{`words:${words.length}`}</Text>
        <TouchableOpacity onPress={() => onDeleteWord("1")}>
          <Text>Delete first</Text>
        </TouchableOpacity>
      </View>
    );
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

describe("CourseWordBankScreen swipe deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    (ReactModule.useState as jest.Mock)
      .mockImplementationOnce(() => [initialWords, mockSetWords])
      .mockImplementationOnce(() => [false, mockSetLoading])
      .mockImplementationOnce(() => ["all", mockSetSelectedFilter]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deletes a single item after the list requests removal", async () => {
    const screen = render(<CourseWordBankScreen />);

    expect(screen.getByText("words:2")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText("Delete first"));
    });

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
    expect(screen.queryByText("1 item selected")).toBeNull();
    expect(screen.queryByText("2 items selected")).toBeNull();
  });

  it("shows the existing error alert and does not update local words when delete fails", async () => {
    (setDoc as jest.Mock).mockRejectedValueOnce(new Error("write failed"));

    const screen = render(<CourseWordBankScreen />);

    expect(screen.getByText("words:2")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText("Delete first"));
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Failed to delete word. Please try again.",
    );
    expect(mockSetWords).not.toHaveBeenCalled();
  });
});
