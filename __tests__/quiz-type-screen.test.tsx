import { render, waitFor } from "@testing-library/react-native";
import React from "react";
import QuizTypeSelectionScreen from "../app/course/[courseId]/quiz-type";

const mockPush = jest.fn();
const mockPrefetchVocabularyCards = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => ({
    courseId: "TOEFL_IELTS",
    day: "1",
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("../src/services/vocabularyPrefetch", () => ({
  prefetchVocabularyCards: (...args: unknown[]) =>
    mockPrefetchVocabularyCards(...args),
}));

jest.mock("../components/course", () => ({
  QuizTypeHeader: () => null,
  QuizTypeGrid: ({
    quizTypes,
  }: {
    quizTypes: Array<{ id: string; title: string }>;
  }) => {
    const { Text, View } = jest.requireActual<typeof import("react-native")>(
      "react-native",
    );

    return (
      <View>
        {quizTypes.map((quizType) => (
          <Text key={quizType.id}>{quizType.title}</Text>
        ))}
      </View>
    );
  },
}));

describe("QuizTypeSelectionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrefetchVocabularyCards.mockResolvedValue([
      {
        id: "1",
        word: "analyze",
        meaning: "examine",
        example: "Analyze the passage.",
        course: "TOEFL_IELTS",
        synonyms: ["study"],
      },
      {
        id: "2",
        word: "derive",
        meaning: "obtain",
        example: "Derive the answer.",
        course: "TOEFL_IELTS",
        synonyms: [],
      },
      {
        id: "3",
        word: "infer",
        meaning: "conclude",
        example: "Infer the result.",
        course: "TOEFL_IELTS",
      },
      {
        id: "4",
        word: "abstract",
        meaning: "summary",
        example: "Write an abstract.",
        course: "TOEFL_IELTS",
      },
    ]);
  });

  it("keeps Synonym Matching visible for TOEFL_IELTS even when few cards have synonyms", async () => {
    const screen = render(<QuizTypeSelectionScreen />);

    await waitFor(() => {
      expect(mockPrefetchVocabularyCards).toHaveBeenCalledWith("TOEFL_IELTS", 1);
    });

    await waitFor(() => {
      expect(screen.getByText("Matching")).toBeTruthy();
      expect(screen.getByText("Synonym Matching")).toBeTruthy();
      expect(screen.getByText("Fill in the Blank")).toBeTruthy();
    });
  });
});
