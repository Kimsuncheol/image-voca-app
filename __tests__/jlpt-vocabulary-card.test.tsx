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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text: MockText } = require("react-native");
    return (
      <MockText testID={testID ?? "mock-image-section"}>
        {imageUrl ?? "placeholder"}
      </MockText>
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
    exampleRoman: "eki to hoteru no aida",
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
    expect(getByText("eki to hoteru no aida")).toBeTruthy();
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

  it("renders exampleRoman below the example and before the translation", () => {
    const { getByText, toJSON } = render(<JlptVocabularyCard item={buildCard()} />);

    expect(getByText("駅とホテルの間")).toBeTruthy();
    expect(getByText("eki to hoteru no aida")).toBeTruthy();
    expect(getByText("between the station and the hotel")).toBeTruthy();

    const renderedTree = JSON.stringify(toJSON());
    expect(renderedTree.indexOf("駅とホテルの間")).toBeLessThan(
      renderedTree.indexOf("eki to hoteru no aida"),
    );
    expect(renderedTree.indexOf("eki to hoteru no aida")).toBeLessThan(
      renderedTree.indexOf("between the station and the hotel"),
    );
  });

  it("omits the exampleRoman row when it is missing", () => {
    const { queryByTestId } = render(
      <JlptVocabularyCard item={buildCard({ exampleRoman: undefined })} />,
    );

    expect(queryByTestId("jlpt-card-example-roman")).toBeNull();
  });

  it("renders mismatched exampleRoman line counts without crashing", () => {
    const { getByText, queryByText } = render(
      <JlptVocabularyCard
        item={buildCard({
          example: "1. 駅とホテルの間\n2. 家と学校の間",
          exampleRoman: "1. eki to hoteru no aida",
          localized: {
            en: {
              meaning: "interval; space; between",
              translation:
                "1. between the station and the hotel\n2. between home and school",
            },
            ko: {
              meaning: "사이, 동안",
              translation: "1. 역과 호텔 사이\n2. 집과 학교 사이",
            },
          },
        })}
      />,
    );

    expect(getByText("eki to hoteru no aida")).toBeTruthy();
    expect(queryByText("ie to gakkou no aida")).toBeNull();
    expect(getByText("between home and school")).toBeTruthy();
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

  it("hides kana-only text inside parentheses by default", () => {
    const { getByText, queryByText } = render(
      <JlptVocabularyCard
        item={buildCard({
          example: "ご飯(ごはん)を食べます",
        })}
      />,
    );

    expect(getByText("ご飯を食べます")).toBeTruthy();
    expect(queryByText("ご飯(ごはん)を食べます")).toBeNull();
  });

  it("shows kana-only text inside parentheses when the feature is active", () => {
    const { getByText, queryByText } = render(
      <JlptVocabularyCard
        item={buildCard({
          example: "ご飯(ごはん)を食べます",
        })}
        showKana={true}
      />,
    );

    expect(getByText("ご飯(ごはん)を食べます")).toBeTruthy();
    expect(queryByText("ご飯を食べます")).toBeNull();
  });

  it("hides inline kana annotations like 赤(あか)ちゃんが泣(な)く。 by default", () => {
    const { getByText, queryByText } = render(
      <JlptVocabularyCard
        item={buildCard({
          example: "赤(あか)ちゃんが泣(な)く。",
        })}
      />,
    );

    expect(getByText("赤ちゃんが泣く。")).toBeTruthy();
    expect(queryByText("赤(あか)ちゃんが泣(な)く。")).toBeNull();
  });

  it("shows inline kana annotations like 赤(あか)ちゃんが泣(な)く。 when active", () => {
    const { getByText, queryByText } = render(
      <JlptVocabularyCard
        item={buildCard({
          example: "赤(あか)ちゃんが泣(な)く。",
        })}
        showKana={true}
      />,
    );

    expect(getByText("赤(あか)ちゃんが泣(な)く。")).toBeTruthy();
    expect(queryByText("赤ちゃんが泣く。")).toBeNull();
  });

  it("keeps non-parenthetical examples unchanged in both kana modes", () => {
    const baseExample = "駅で待ちます";
    const hiddenKana = render(
      <JlptVocabularyCard
        item={buildCard({
          example: baseExample,
        })}
        showKana={false}
      />,
    );
    const shownKana = render(
      <JlptVocabularyCard
        item={buildCard({
          example: baseExample,
        })}
        showKana={true}
      />,
    );

    expect(hiddenKana.getByText(baseExample)).toBeTruthy();
    expect(shownKana.getByText(baseExample)).toBeTruthy();
  });

  it("renders the がな footer control below the scrollable card content", () => {
    const { getByTestId, getByText, toJSON } = render(
      <JlptVocabularyCard item={buildCard()} />,
    );

    expect(getByTestId("jlpt-card-kana-toggle-bar")).toBeTruthy();
    expect(getByTestId("jlpt-card-kana-toggle-switch")).toBeTruthy();
    expect(getByText("がな")).toBeTruthy();

    const renderedTree = JSON.stringify(toJSON());
    expect(renderedTree.indexOf("jlpt-card-info-scroll")).toBeLessThan(
      renderedTree.indexOf("jlpt-card-kana-toggle-bar"),
    );
  });
});
