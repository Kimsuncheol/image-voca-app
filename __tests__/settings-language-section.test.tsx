import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import { LanguageSection } from "../components/settings/LanguageSection";

const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const styles = StyleSheet.create({
  section: {},
  sectionTitle: {},
  card: {},
  option: {},
  optionLeft: {},
  optionRight: {},
  optionTextGroup: {},
  optionText: {},
  optionValue: {},
  separator: {},
});

const translations: Record<string, string> = {
  "settings.language.title": "Language",
  "settings.language.systemDefault": "System Default",
  "settings.language.english": "English",
  "settings.language.korean": "Korean",
  "settings.language.japanese": "Japanese",
};

describe("LanguageSection", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
  });

  it("renders a compact display-language summary row", () => {
    const screen = render(
      <LanguageSection
        styles={styles}
        isDark={false}
        currentMode="system"
        t={(key) => translations[key] ?? key}
      />,
    );

    expect(screen.getAllByText("Language")).toHaveLength(2);
    expect(screen.getByText("System Default")).toBeTruthy();
    expect(screen.queryByText("Korean")).toBeNull();
    expect(screen.queryByText("Japanese")).toBeNull();
  });

  it("navigates to the display language screen", () => {
    const screen = render(
      <LanguageSection
        styles={styles}
        isDark={false}
        currentMode="en"
        t={(key) => translations[key] ?? key}
      />,
    );

    expect(screen.getByText("English")).toBeTruthy();
    fireEvent.press(screen.getByTestId("settings-language-row"));

    expect(mockRouterPush).toHaveBeenCalledWith("/settings-language");
  });
});
