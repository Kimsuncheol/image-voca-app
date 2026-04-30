import { render } from "@testing-library/react-native";
import React from "react";
import { SwipeCardItem } from "../components/swipe/SwipeCardItem";
import { VocabularyCard } from "../src/types/vocabulary";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("expo-speech", () => ({
  speak: jest.fn(),
}));

jest.mock("../components/swipe/SwipeCardItemImageSection", () => ({
  __esModule: true,
  SwipeCardItemImageSection: ({ topRightOverlay }: any) => {
    const React = require("react");
    const { View } = require("react-native");

    return (
      <View testID="mock-image-section">
        {topRightOverlay}
      </View>
    );
  },
}));

jest.mock("../components/swipe/SwipeCardItemAddToWordBankButton", () => ({
  __esModule: true,
  SwipeCardItemAddToWordBankButton: () => {
    const React = require("react");
    const { View } = require("react-native");

    return <View testID="mock-add-button" />;
  },
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

function buildCard(overrides: Partial<VocabularyCard> = {}): VocabularyCard {
  return {
    id: "1",
    word: "abandon",
    meaning: "to leave behind",
    pronunciation: "/əˈbæn.dən/",
    example: "They had to abandon the plan.",
    translation: "그들은 그 계획을 포기해야 했다.",
    course: "TOEFL_IELTS",
    synonyms: ["discard", " leave ", "", "forsake"],
    ...overrides,
  };
}

describe("SwipeCardItem synonyms", () => {
  it("renders the synonyms section for TOEFL_IELTS cards", () => {
    const { getByText, getByTestId } = render(<SwipeCardItem item={buildCard()} />);

    expect(getByText("그들은 그 계획을 포기해야 했다.")).toBeTruthy();
    expect(getByText("Synonyms")).toBeTruthy();
    expect(getByTestId("swipe-card-synonyms").props.children).toBe(
      "discard, leave, forsake",
    );
    expect(getByTestId("swipe-card-synonyms")).toHaveStyle({
      fontSize: 15,
      color: "#374151",
    });
  });

  it("hides the save overlay in preview mode", () => {
    const { queryByTestId } = render(
      <SwipeCardItem item={buildCard()} isPreviewMode />,
    );

    expect(queryByTestId("mock-add-button")).toBeNull();
  });

  it("hides the synonyms section for non-TOEFL_IELTS cards", () => {
    const { queryByText, queryByTestId } = render(
      <SwipeCardItem item={buildCard({ course: "TOEIC" })} />,
    );

    expect(queryByText("Synonyms")).toBeNull();
    expect(queryByTestId("swipe-card-synonyms-section")).toBeNull();
  });

  it("renders all example rows without a show-more control or line caps", () => {
    const { getByText, queryByText } = render(
      <SwipeCardItem
        item={buildCard({
          course: "TOEIC",
          example:
            "1. First complete example sentence.\n2. Second complete example sentence.\n3. Third complete example sentence.\n4. Fourth complete example sentence.",
          translation:
            "1. First complete translation.\n2. Second complete translation.\n3. Third complete translation.\n4. Fourth complete translation.",
        })}
      />,
    );

    const firstExample = getByText("First complete example sentence.");
    const firstTranslation = getByText("First complete translation.");

    expect(getByText("Fourth complete example sentence.")).toBeTruthy();
    expect(getByText("Fourth complete translation.")).toBeTruthy();
    expect(queryByText("Show 1 more")).toBeNull();
    expect(firstExample.props.numberOfLines).toBeUndefined();
    expect(firstTranslation.props.numberOfLines).toBeUndefined();
  });
});
