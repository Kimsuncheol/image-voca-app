import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import BackSide from "../components/CollocationFlipCard/BackSide";
import ExampleSection from "../components/CollocationFlipCard/ExampleSection";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockReact = React;
const mockText = Text;

jest.mock("react-native-collapsible", () => {
  return ({
    collapsed,
    children,
  }: {
    collapsed: boolean;
    children: React.ReactNode;
  }) => (collapsed ? null : children);
});

jest.mock("../components/CollocationFlipCard/SpeakerButton", () => {
  return {
    SpeakerButton: () =>
      mockReact.createElement(mockText, null, "Speaker Button"),
  };
});

describe("ExampleSection", () => {
  test("renders two-line items with role, example, and translation", () => {
    const { getByText, queryByText } = render(
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
