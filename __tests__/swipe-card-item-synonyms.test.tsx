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
      color: "#2F2F2F",
    });
  });

  it("hides the synonyms section for non-TOEFL_IELTS cards", () => {
    const { queryByText, queryByTestId } = render(
      <SwipeCardItem item={buildCard({ course: "TOEIC" })} />,
    );

    expect(queryByText("Synonyms")).toBeNull();
    expect(queryByTestId("swipe-card-synonyms-section")).toBeNull();
  });
});
