import { render } from "@testing-library/react-native";
import React from "react";
import { JlptVocabularyCard } from "../components/course/vocabulary/JlptVocabularyCard";
import { VocabularyCard } from "../src/types/vocabulary";

let mockLanguage = "en";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: jest.fn(),
  }),
}));

jest.mock("../components/swipe/SwipeCardItemImageSection", () => ({
  __esModule: true,
  SwipeCardItemImageSection: ({
    imageUrl,
    testID,
  }: {
    imageUrl?: string;
    testID?: string;
  }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return (
      <Text testID={testID ?? "mock-image-section"}>
        {imageUrl ?? "placeholder"}
      </Text>
    );
  },
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => null,
}));

function buildCard(overrides: Partial<VocabularyCard> = {}): VocabularyCard {
  return {
    id: "N5_Day1_1",
    word: "間",
    meaning: "interval; space; between",
    pronunciation: "あいだ",
    pronunciationRoman: "aida",
    example: "駅とホテルの間",
    imageUrl: "https://cdn.example.com/jlpt.jpg",
    course: "JLPT_N5",
    localized: {
      en: {
        meaning: "interval; space; between",
        translation: "between the station and the hotel",
      },
      ko: {
        meaning: "사이, 동안",
        translation: "역과 호텔 사이",
      },
    },
    ...overrides,
  };
}

describe("JlptVocabularyCard", () => {
  beforeEach(() => {
    mockLanguage = "en";
  });

  it("renders English meaning and translation for English UI", () => {
    const { getByText, getByTestId, queryByText } = render(
      <JlptVocabularyCard item={buildCard()} initialIsSaved={true} day={1} />,
    );

    expect(getByTestId("jlpt-card-image-shell")).toBeTruthy();
    expect(getByTestId("jlpt-card-image-shell").props.children).toBe(
      "https://cdn.example.com/jlpt.jpg",
    );
    expect(getByTestId("jlpt-card-info")).toBeTruthy();
    expect(getByTestId("jlpt-card-info-scroll")).toBeTruthy();
    expect(getByText("間")).toBeTruthy();
    expect(getByText("あいだ [aida]")).toBeTruthy();
    expect(getByText("interval; space; between")).toBeTruthy();
    expect(getByText("between the station and the hotel")).toBeTruthy();
    expect(getByText("駅とホテルの間")).toBeTruthy();
    expect(queryByText("Meaning")).toBeNull();
    expect(queryByText("Example")).toBeNull();
  });

  it("renders Korean meaning and translation for Korean UI", () => {
    mockLanguage = "ko";

    const { getByText, queryByText } = render(
      <JlptVocabularyCard item={buildCard()} initialIsSaved={true} day={1} />,
    );

    expect(getByText("사이, 동안")).toBeTruthy();
    expect(getByText("역과 호텔 사이")).toBeTruthy();
    expect(queryByText("interval; space; between")).toBeNull();
    expect(queryByText("between the station and the hotel")).toBeNull();
  });

  it("falls back to English content when Korean localization is missing", () => {
    mockLanguage = "ko";

    const { getByText, queryByTestId } = render(
      <JlptVocabularyCard
        item={buildCard({
          localized: {
            en: {
              meaning: "interval; space; between",
              translation: "between the station and the hotel",
            },
            ko: undefined,
          },
        })}
      />,
    );

    expect(getByText("interval; space; between")).toBeTruthy();
    expect(getByText("between the station and the hotel")).toBeTruthy();
    expect(queryByTestId("jlpt-card-translation")).toBeTruthy();
  });

  it("hides empty JLPT rows while keeping the card render stable", () => {
    const { queryByTestId, getByTestId } = render(
      <JlptVocabularyCard
        item={buildCard({
          pronunciation: " ",
          pronunciationRoman: undefined,
          imageUrl: undefined,
          localized: {
            en: { meaning: "interval; space; between", translation: undefined },
            ko: { meaning: undefined, translation: "" },
          },
        })}
      />,
    );

    expect(queryByTestId("jlpt-card-pronunciation")).toBeNull();
    expect(queryByTestId("jlpt-card-translation")).toBeNull();
    expect(getByTestId("jlpt-card-image-shell").props.children).toBe(
      "placeholder",
    );
  });

  it("renders only the pronunciation value when romanization is missing", () => {
    const { getByText, queryByTestId } = render(
      <JlptVocabularyCard
        item={buildCard({ pronunciationRoman: undefined })}
        initialIsSaved={true}
        day={1}
      />,
    );

    expect(getByText("あいだ")).toBeTruthy();
    expect(queryByTestId("jlpt-card-pronunciation-roman")).toBeNull();
  });

  it("renders only bracketed romanization when pronunciation is missing", () => {
    const { getByText, queryByTestId } = render(
      <JlptVocabularyCard
        item={buildCard({ pronunciation: undefined, pronunciationRoman: "aida" })}
        initialIsSaved={true}
        day={1}
      />,
    );

    expect(getByText("[aida]")).toBeTruthy();
    expect(queryByTestId("jlpt-card-pronunciation-roman")).toBeNull();
  });
});
