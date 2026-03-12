import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import FaceSide from "../components/CollocationFlipCard/FaceSide";
import { WordCard } from "../components/wordbank/WordCard";

const mockSpeak = jest.fn();

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    recordWordLearned: jest.fn(),
  }),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

jest.mock("../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("Word bank delete mode interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeak.mockResolvedValue(undefined);
  });

  it("starts delete mode from a word card long press and toggles selection while active", () => {
    const onStartDeleteMode = jest.fn();
    const onToggleSelection = jest.fn();
    const screen = render(
      <WordCard
        word={{
          id: "1",
          word: "abandon",
          meaning: "to leave behind",
          translation: "버리다",
          pronunciation: "/əˈbændən/",
          example: "They abandoned the plan.",
          course: "TOEIC",
          addedAt: "2026-01-01T00:00:00.000Z",
        }}
        isDark={false}
        onStartDeleteMode={onStartDeleteMode}
      />,
    );

    fireEvent(screen.getByTestId("word-card-1"), "onLongPress");
    expect(onStartDeleteMode).toHaveBeenCalledWith("1");

    screen.rerender(
      <WordCard
        word={{
          id: "1",
          word: "abandon",
          meaning: "to leave behind",
          translation: "버리다",
          pronunciation: "/əˈbændən/",
          example: "They abandoned the plan.",
          course: "TOEIC",
          addedAt: "2026-01-01T00:00:00.000Z",
        }}
        isDark={false}
        isDeleteMode={true}
        isSelected={true}
        onStartDeleteMode={onStartDeleteMode}
        onToggleSelection={onToggleSelection}
      />,
    );

    fireEvent.press(screen.getByTestId("word-card-1"));
    expect(onToggleSelection).toHaveBeenCalledWith("1");
  });

  it("starts delete mode from a collocation card long press and toggles selection while active", () => {
    const onStartDeleteMode = jest.fn();
    const onToggleSelection = jest.fn();
    const screen = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
        }}
        isDark={false}
        wordBankConfig={{
          id: "1",
          course: "COLLOCATION",
          enableAdd: false,
          onStartDeleteMode,
        }}
      />,
    );

    fireEvent(screen.getByText("make a decision"), "onLongPress");
    expect(onStartDeleteMode).toHaveBeenCalledWith("1");

    screen.rerender(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
        }}
        isDark={false}
        wordBankConfig={{
          id: "1",
          course: "COLLOCATION",
          enableAdd: false,
          isDeleteMode: true,
          isSelected: true,
          onStartDeleteMode,
          onToggleSelection,
        }}
      />,
    );

    fireEvent.press(screen.getByText("make a decision"));
    expect(onToggleSelection).toHaveBeenCalledWith("1");
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
