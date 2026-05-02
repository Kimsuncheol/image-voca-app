import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import BackSide from "../components/CollocationFlipCard/BackSide";
import ExampleSection from "../components/CollocationFlipCard/ExampleSection";
import { getFontColors } from "../constants/fontColors";

const mockSpeak = jest.fn();
const lightFontColors = getFontColors(false);

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return <Text testID={`collocation-example-chevron-${name}`} />;
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? _key,
  }),
}));

jest.mock("react-native-collapsible", () => {
  return ({
    collapsed,
    children,
  }: {
    collapsed: boolean;
    children: React.ReactNode;
  }) => (collapsed ? null : children);
});

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    isSpeaking: false,
    isPaused: false,
    error: null,
  }),
}));

describe("ExampleSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeak.mockResolvedValue(undefined);
  });

  test("renders two-line items with role, example, and translation", () => {
    const { getByTestId, getByText, queryByText } = render(
      <ExampleSection
        example="John: I want to go to the beach. Mary: Let's go to the mountains."
        translation="Jane: 난 해변에 가고 싶어. Michelle: 이번엔 산에 가자."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(getByText("John")).toBeTruthy();
    expect(getByText("Mary")).toBeTruthy();
    expect(getByText("난 해변에 가고 싶어.")).toBeTruthy();
    expect(getByText("이번엔 산에 가자.")).toBeTruthy();
    expect(queryByText("Jane")).toBeNull();
    expect(queryByText("Michelle")).toBeNull();
    expect(
      StyleSheet.flatten(getByTestId("collocation-back-translation").props.style),
    ).toEqual(
      expect.objectContaining({ color: lightFontColors.learningCardMuted }),
    );
  });

  test("does not render the old speaker button", () => {
    const { queryByText } = render(
      <ExampleSection
        example="John: I want to go to the beach."
        translation="Jane: 난 해변에 가고 싶어."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(queryByText("Speaker Button")).toBeNull();
  });

  test("masks the collocation explanation value while masked", () => {
    const { getByText } = render(
      <BackSide
        data={{
          collocation: "make a decision",
          meaning: "decide",
          explanation: "make a decision pronunciation",
          example: "She [[[made a decision]]].",
          translation: "그녀는 결정을 내렸다.",
          imageUrl: "",
        }}
        isDark={false}
        isVisible={true}
        isReviewMode={true}
      />,
    );

    expect(
      StyleSheet.flatten(getByText("make a decision pronunciation").props.style),
    ).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
      }),
    );
  });

  test("speaks the full original example when example text is pressed", async () => {
    const fullExample =
      "John: I want to go to the beach. Mary: Let's go to the mountains.";
    const spokenExample =
      "I want to go to the beach.\nLet's go to the mountains.";
    const { getByText } = render(
      <ExampleSection
        example={fullExample}
        translation="Jane: 난 해변에 가고 싶어. Michelle: 이번엔 산에 가자."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    fireEvent.press(getByText("I want to go to the beach."));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith(spokenExample, {
        language: "en-US",
      });
    });
  });

  test("speaks the full original example when translation text is pressed", async () => {
    const fullExample =
      "John: I want to go to the beach. Mary: Let's go to the mountains.";
    const spokenExample =
      "I want to go to the beach.\nLet's go to the mountains.";
    const { getByText } = render(
      <ExampleSection
        example={fullExample}
        translation="Jane: 난 해변에 가고 싶어. Michelle: 이번엔 산에 가자."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    fireEvent.press(getByText("난 해변에 가고 싶어."));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith(spokenExample, {
        language: "en-US",
      });
    });
  });

  test("speaks the example without role names when role label text is pressed", async () => {
    const fullExample =
      "John: I want to go to the beach. Mary: Let's go to the mountains.";
    const spokenExample =
      "I want to go to the beach.\nLet's go to the mountains.";
    const { getByText } = render(
      <ExampleSection
        example={fullExample}
        translation="Jane: 난 해변에 가고 싶어. Michelle: 이번엔 산에 가자."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    fireEvent.press(getByText("John"));

    await waitFor(() => {
      expect(mockSpeak).toHaveBeenCalledWith(spokenExample, {
        language: "en-US",
      });
    });
  });

  test("uses example turns as source of truth when translation has extra turns", () => {
    const { getByText, queryByText } = render(
      <ExampleSection
        example="A: Hello there."
        translation="Jane: 첫 번째 문장. Michelle: 두 번째 문장."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(getByText("A")).toBeTruthy();
    expect(getByText("Hello there.")).toBeTruthy();
    expect(getByText("첫 번째 문장.")).toBeTruthy();
    expect(queryByText("두 번째 문장.")).toBeNull();
    expect(queryByText("Jane")).toBeNull();
    expect(queryByText("Michelle")).toBeNull();
  });

  test("keeps empty character cell for non-role example turns", () => {
    const { getByText, queryByText } = render(
      <ExampleSection
        example="This is a plain example sentence."
        translation="이것은 일반 예문 번역입니다."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(getByText("This is a plain example sentence.")).toBeTruthy();
    expect(getByText("이것은 일반 예문 번역입니다.")).toBeTruthy();
    expect(queryByText("NARRATION")).toBeNull();
  });

  test("renders whitespace-separated character names on multiple lines", () => {
    const { getByText } = render(
      <ExampleSection
        example="Rock climber: Wow, those are some steep cliffs."
        translation="등반가: 와, 절벽이 정말 가파르네."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(getByText("Rock\nclimber")).toBeTruthy();
    expect(getByText("Wow, those are some steep cliffs.")).toBeTruthy();
  });

  test("applies maxHeight style cap to scroll view when provided", () => {
    const { UNSAFE_getByType } = render(
      <ExampleSection
        example="John: A sample sentence."
        translation="Jane: 샘플 문장."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
        maxHeight={1000}
      />,
    );

    const scrollView = UNSAFE_getByType(ScrollView);
    const flattenedStyle = StyleSheet.flatten(scrollView.props.style) || {};

    expect(flattenedStyle.maxHeight).toBe(1000);
    expect(flattenedStyle.flexGrow).toBe(0);
  });

  test("applies overflow-safe styles to prevent horizontal clipping", () => {
    const { UNSAFE_getAllByType } = render(
      <ExampleSection
        example="LongCharacterNameWithNoBreaks: Supercalifragilisticexpialidocious long sentence for overflow checks."
        translation="매우 긴 번역 문장으로 overflow 방지를 확인합니다."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    const viewNodes = UNSAFE_getAllByType(View);
    const flattenedStyles = viewNodes.map((node) =>
      StyleSheet.flatten(node.props.style),
    );

    const hasShrinkableTextColumn = flattenedStyles.some(
      (style) =>
        style &&
        style.flex === 1 &&
        style.minWidth === 0 &&
        style.flexShrink === 1,
    );

    const hasMinHeightGuard = flattenedStyles.some(
      (style) => style && style.minHeight === 0,
    );

    expect(hasShrinkableTextColumn).toBe(true);
    expect(hasMinHeightGuard).toBe(true);
  });

  test("renders mask toggle in the example header without toggling the section", () => {
    const onToggle = jest.fn();
    const onMaskChange = jest.fn();
    const { getByText, getByTestId, queryByText, rerender, toJSON } = render(
      <ExampleSection
        example="John: I want to go to the beach."
        translation="Jane: 난 해변에 가고 싶어."
        isOpen={true}
        onToggle={onToggle}
        isDark={false}
        isReviewMode={false}
        onMaskChange={onMaskChange}
      />,
    );

    const renderedTree = JSON.stringify(toJSON());

    expect(getByText("EXAMPLE")).toBeTruthy();
    expect(getByText("Mask")).toBeTruthy();
    expect(queryByText("Show")).toBeNull();
    expect(getByTestId("collocation-example-chevron-chevron-up")).toBeTruthy();
    expect(getByTestId("collocation-example-mask-toggle-button").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(renderedTree).toContain("collocation-example-mask-toggle");
    expect(renderedTree).toContain("collocation-example-chevron-chevron-up");

    fireEvent.press(getByTestId("collocation-example-mask-toggle-button"));

    rerender(
      <ExampleSection
        example="John: I want to go to the beach."
        translation="Jane: 난 해변에 가고 싶어."
        isOpen={true}
        onToggle={onToggle}
        isDark={false}
        isReviewMode={true}
        onMaskChange={onMaskChange}
      />,
    );

    fireEvent.press(getByTestId("collocation-example-mask-toggle-button"));

    expect(onToggle).not.toHaveBeenCalled();
    expect(onMaskChange).toHaveBeenNthCalledWith(1, true);
    expect(onMaskChange).toHaveBeenNthCalledWith(2, false);
  });

  test("keeps bracketed example spans invisible only while masked", () => {
    const masked = render(
      <ExampleSection
        example="John: I want to [[[go]]] now."
        translation="Jane: 지금 가고 싶어."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
        isReviewMode={true}
      />,
    );
    const shown = render(
      <ExampleSection
        example="John: I want to [[[go]]] now."
        translation="Jane: 지금 가고 싶어."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
        isReviewMode={false}
      />,
    );

    expect(StyleSheet.flatten(masked.getByText("go").props.style)).toEqual(
      expect.objectContaining({
        color: "transparent",
        backgroundColor: "transparent",
      }),
    );
    expect(StyleSheet.flatten(shown.getByText("go").props.style)).not.toEqual(
      expect.objectContaining({ color: "transparent" }),
    );
  });
});

describe("BackSide", () => {
  test("hides translation section and maps translation initial section to example", () => {
    const data = {
      collocation: "want to",
      meaning: "~하고 싶다",
      explanation: "This explanation should be hidden when example is open.",
      example: "Alex: I want to go now.",
      translation: "Jane: 지금 가고 싶어.",
    };

    const { getByText, queryByText } = render(
      <BackSide
        data={data}
        isDark={false}
        isVisible={true}
        initialSection="translation"
      />,
    );

    expect(queryByText("TRANSLATION")).toBeNull();
    expect(queryByText(data.explanation)).toBeNull();
    expect(getByText("EXAMPLE")).toBeTruthy();
    expect(getByText("지금 가고 싶어.")).toBeTruthy();
  });
});
