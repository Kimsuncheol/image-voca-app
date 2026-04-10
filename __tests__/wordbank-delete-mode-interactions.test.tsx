import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { SwipeToDeleteRow } from "../components/course-wordbank/SwipeToDeleteRow.web";
import { WordCard } from "../components/wordbank/WordCard";

const mockSpeak = jest.fn();

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: "en",
  }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
    i18n: {
      language: "en",
    },
  }),
}));

jest.mock("../components/themed-text", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("Word bank swipe delete interactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeak.mockResolvedValue(undefined);
  });

  it("keeps title-driven TTS working without delete-mode props", async () => {
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
      />,
    );

    fireEvent.press(screen.getByText("abandon"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith("abandon", {
        language: "en-US",
      });
    });
  });

  it("uses the swipe row delete action for word bank removal", () => {
    const onDelete = jest.fn();
    const screen = render(
      <SwipeToDeleteRow itemId="1" isDark={false} onDelete={onDelete}>
        <WordCard
          word={{
            id: "1",
            word: "make a decision",
            meaning: "결정을 내리다",
            translation: "그녀는 결정을 내렸다.",
            pronunciation: "",
            example: "She made a decision quickly.",
            course: "COLLOCATION",
            addedAt: "2026-01-01T00:00:00.000Z",
          }}
          isDark={false}
          showPronunciation={false}
          expandExampleToContent={true}
        />
      </SwipeToDeleteRow>
    );

    fireEvent.press(screen.getByTestId("delete-action-1"));
    expect(onDelete).toHaveBeenCalledWith("1");
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
