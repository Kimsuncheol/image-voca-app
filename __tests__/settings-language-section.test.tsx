import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import { LanguageSection } from "../components/settings/LanguageSection";
import type { LanguageMode } from "../src/i18n";

jest.mock("../src/i18n", () => ({
  __esModule: true,
}));

const styles = StyleSheet.create({
  section: {},
  sectionTitle: {},
  card: {},
  option: {},
  optionLeft: {},
  optionTextGroup: {},
  optionText: {},
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
  it("renders system and manual language options", () => {
    const onChangeLanguageMode = jest.fn();

    const screen = render(
      <LanguageSection
        styles={styles}
        isDark={false}
        currentMode="system"
        onChangeLanguageMode={onChangeLanguageMode}
        t={(key) => translations[key] ?? key}
      />,
    );

    expect(screen.getByText("System Default")).toBeTruthy();
    expect(screen.queryByText("Current: Japanese")).toBeNull();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Korean")).toBeTruthy();
    expect(screen.getByText("Japanese")).toBeTruthy();
  });

  it("emits the selected language mode", () => {
    const onChangeLanguageMode = jest.fn<void, [LanguageMode]>();

    const screen = render(
      <LanguageSection
        styles={styles}
        isDark={false}
        currentMode="en"
        onChangeLanguageMode={onChangeLanguageMode}
        t={(key) => translations[key] ?? key}
      />,
    );

    fireEvent.press(screen.getByText("System Default"));
    fireEvent.press(screen.getByText("Korean"));

    expect(onChangeLanguageMode).toHaveBeenNthCalledWith(1, "system");
    expect(onChangeLanguageMode).toHaveBeenNthCalledWith(2, "ko");
  });
});
