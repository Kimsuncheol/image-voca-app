import { render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { WordCard } from "../components/wordbank/WordCard";

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => ({
    learningLanguage: "en",
  }),
}));

jest.mock("../components/wordbank/KanjiWordBankCard", () => ({
  KanjiWordBankCard: () => null,
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
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("Word bank WordCard synonyms", () => {
  const baseWord = {
    id: "1",
    word: "abandon",
    meaning: "to leave behind",
    translation: "그들은 계획을 포기했다.",
    pronunciation: "/əˈbændən/",
    example: "They abandoned the plan.",
    course: "TOEFL_IELTS",
    synonyms: ["discard", " leave ", "", "forsake"],
    addedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders the synonyms section for saved TOEFL_IELTS words", () => {
    const { getByText, getByTestId } = render(
      <WordCard word={baseWord} isDark={false} />,
    );

    expect(getByText("그들은 계획을 포기했다.")).toBeTruthy();
    expect(getByText("Synonyms:")).toBeTruthy();
    expect(getByTestId("word-card-synonyms").props.children).toBe(
      "discard, leave, forsake",
    );
    expect(getByTestId("word-card-synonyms")).toHaveStyle({
      fontSize: 15,
      color: "#2F2F2F",
    });
  });

  it("does not render the synonyms section for other courses", () => {
    const { queryByText, queryByTestId } = render(
      <WordCard
        word={{
          ...baseWord,
          course: "TOEIC",
        }}
        isDark={false}
      />,
    );

    expect(queryByText("Synonyms:")).toBeNull();
    expect(queryByTestId("word-card-synonyms-section")).toBeNull();
  });

  it("formats idiom meanings onto separate lines and scales long idiom titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <WordCard
        word={{
          ...baseWord,
          course: "CSAT_IDIOMS",
          word: "once in a blue moon",
          meaning: "1. 아주 드물게 2. 거의 하지 않게",
          synonyms: undefined,
        }}
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeNull();

    const titleStyle = StyleSheet.flatten(
      getByTestId("word-card-title").props.style,
    );
    expect(titleStyle.fontSize).toBeLessThan(22);
  });

  it("formats extremely advanced meanings onto separate lines and scales long titles", () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <WordCard
        word={{
          ...baseWord,
          course: "EXTREMELY_ADVANCED",
          word: "antidisestablishmentarianism",
          meaning: "1. 정교분리 반대론 2. 긴 단어",
          synonyms: undefined,
        }}
        isDark={false}
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();

    const titleStyle = StyleSheet.flatten(
      getByTestId("word-card-title").props.style,
    );
    expect(titleStyle.fontSize).toBeLessThan(22);
  });
});
