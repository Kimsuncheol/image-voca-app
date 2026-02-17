import { render } from "@testing-library/react-native";
import React from "react";
import BackSide from "../components/CollocationFlipCard/BackSide";
import ExampleSection from "../components/CollocationFlipCard/ExampleSection";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("../components/RoleplayDialogueRow", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    RoleplayDialogueRow: ({
      role,
      text,
    }: {
      role: string;
      text: React.ReactNode;
    }) => (
      <View>
        <Text>{role}</Text>
        {text}
      </View>
    ),
  };
});

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
  const React = require("react");
  const { Text } = require("react-native");
  return {
    SpeakerButton: () => <Text>Speaker Button</Text>,
  };
});

describe("ExampleSection", () => {
  test("renders interleaved translation without translation role labels", () => {
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

  test("falls back to full translation block when turn counts mismatch", () => {
    const { getByText, queryByText } = render(
      <ExampleSection
        example="A: Hello there."
        translation="Jane: 첫 번째 문장. Michelle: 두 번째 문장."
        isOpen={true}
        onToggle={jest.fn()}
        isDark={false}
      />,
    );

    expect(getByText(/첫 번째 문장\./)).toBeTruthy();
    expect(getByText(/두 번째 문장\./)).toBeTruthy();
    expect(queryByText("Jane")).toBeNull();
    expect(queryByText("Michelle")).toBeNull();
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
