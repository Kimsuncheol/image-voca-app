import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";
import { EyeComfortHeaderButton } from "../src/components/common/EyeComfortHeaderButton";

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: false,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? "Eye Comfort Mode",
  }),
}));

describe("EyeComfortHeaderButton", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetReadingDisplayStoreForTests();
    useReadingDisplayStore.setState({ _initialized: true });
  });

  it("renders an Aa button and opens the reading display modal", () => {
    const screen = render(<EyeComfortHeaderButton />);
    const button = screen.getByTestId("eye-comfort-header-button");

    expect(screen.getByText("Aa")).toBeTruthy();

    fireEvent.press(button);

    expect(useReadingDisplayStore.getState().isDisplayModalOpen).toBe(
      true,
    );
  });

  it("does not toggle eye comfort directly", () => {
    const screen = render(<EyeComfortHeaderButton />);
    const button = screen.getByTestId("eye-comfort-header-button");

    expect(useReadingDisplayStore.getState().eyeComfortEnabled).toBe(false);

    fireEvent.press(button);

    expect(useReadingDisplayStore.getState().eyeComfortEnabled).toBe(false);
  });
});
