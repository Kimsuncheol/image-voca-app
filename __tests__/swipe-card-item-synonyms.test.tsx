import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
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
    const { getByText, queryByText, toJSON } = render(
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
    expect(JSON.stringify(toJSON()).indexOf("Fourth complete translation.")).toBeLessThan(
      JSON.stringify(toJSON()).indexOf("swipe-card-mask-toggle-row"),
    );
  });

  it("renders the mask visibility control at the bottom of standard cards", () => {
    const { getByText, getByTestId, queryByText, toJSON } = render(
      <SwipeCardItem item={buildCard({ course: "TOEIC" })} />,
    );
    const renderedTree = JSON.stringify(toJSON());

    expect(getByTestId("swipe-card-mask-toggle-row")).toBeTruthy();
    expect(getByTestId("swipe-card-mask-toggle")).toBeTruthy();
    expect(getByText("Mask")).toBeTruthy();
    expect(queryByText("Show")).toBeNull();
    expect(renderedTree.indexOf("inline-meaning")).toBeLessThan(
      renderedTree.indexOf("swipe-card-mask-toggle-row"),
    );
  });

  it("calls onMaskChange from the standard card visibility control", () => {
    const onMaskChange = jest.fn();
    const { getByTestId, rerender } = render(
      <SwipeCardItem
        item={buildCard({ course: "TOEIC" })}
        isReviewMode={false}
        onMaskChange={onMaskChange}
      />,
    );

    expect(getByTestId("swipe-card-mask-toggle-button").props.accessibilityState).toEqual({
      selected: true,
    });

    fireEvent.press(getByTestId("swipe-card-mask-toggle-button"));

    rerender(
      <SwipeCardItem
        item={buildCard({ course: "TOEIC" })}
        isReviewMode={true}
        onMaskChange={onMaskChange}
      />,
    );

    fireEvent.press(getByTestId("swipe-card-mask-toggle-button"));

    expect(onMaskChange).toHaveBeenNthCalledWith(1, true);
    expect(onMaskChange).toHaveBeenNthCalledWith(2, false);
  });

  it("masks the standard card pronunciation while masked", () => {
    const { getByText } = render(
      <SwipeCardItem item={buildCard({ course: "TOEIC" })} isReviewMode />,
    );

    expect(StyleSheet.flatten(getByText("/əˈbæn.dən/").props.style)).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
      }),
    );
  });
});
