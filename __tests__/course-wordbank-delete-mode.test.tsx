import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { getDoc, setDoc } from "firebase/firestore";
import React from "react";
import { Alert } from "react-native";
import CourseWordBankScreen from "../app/courses/[course]";

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    Stack: {
      Screen: () => null,
    },
    useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), []);
    }),
    useLocalSearchParams: () => ({
      course: "TOEIC",
    }),
  };
});

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
    t: (_key: string, options?: { defaultValue?: string; count?: number }) =>
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
    onStartDeleteMode,
    onToggleSelection,
  }: {
    words: Array<{ id: string; word: string }>;
    onStartDeleteMode: (wordId: string) => void;
    onToggleSelection: (wordId: string) => void;
  }) => {
    const React = require("react");
    const { Text, TouchableOpacity, View } = require("react-native");

    return (
      <View>
        <Text>{`words:${words.length}`}</Text>
        <TouchableOpacity onPress={() => onStartDeleteMode("1")}>
          <Text>Start delete</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToggleSelection("2")}>
          <Text>Toggle second</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe("CourseWordBankScreen delete mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        words: [
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
        ],
      }),
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("bulk deletes selected items and exits delete mode after success", async () => {
    const screen = render(<CourseWordBankScreen />);

    await waitFor(() => {
      expect(screen.getByText("words:2")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Start delete"));
    fireEvent.press(screen.getByText("Toggle second"));

    expect(screen.getByText("2 items selected")).toBeTruthy();

    fireEvent.press(screen.getByText("Delete"));

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await alertButtons[1].onPress();
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith("mock-doc-ref", {
        words: [],
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("2 items selected")).toBeNull();
    });
  });

  it("keeps delete mode active when bulk delete fails", async () => {
    (setDoc as jest.Mock).mockRejectedValueOnce(new Error("write failed"));

    const screen = render(<CourseWordBankScreen />);

    await waitFor(() => {
      expect(screen.getByText("words:2")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Start delete"));
    expect(screen.getByText("1 item selected")).toBeTruthy();

    fireEvent.press(screen.getByText("Delete"));
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await alertButtons[1].onPress();
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });

    expect(screen.getByText("1 item selected")).toBeTruthy();
  });
});
