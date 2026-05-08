import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import {
  __resetEyeComfortStoreForTests,
  useEyeComfortStore,
} from "../src/stores/eyeComfortStore";
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
    __resetEyeComfortStoreForTests();
    useEyeComfortStore.setState({ _initialized: true });
  });

  it("indicates inactive state and toggles eye comfort on immediately", () => {
    const screen = render(<EyeComfortHeaderButton />);
    const button = screen.getByTestId("eye-comfort-header-button");

    expect(button.props.accessibilityState).toEqual({ selected: false });

    fireEvent.press(button);

    expect(useEyeComfortStore.getState().isEnabled).toBe(true);
    expect(
      screen.getByTestId("eye-comfort-header-button").props
        .accessibilityState,
    ).toEqual({ selected: true });
  });

  it("indicates active state and toggles eye comfort off immediately", () => {
    useEyeComfortStore.setState({ isEnabled: true, level: "medium" });

    const screen = render(<EyeComfortHeaderButton />);
    const button = screen.getByTestId("eye-comfort-header-button");

    expect(button.props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(button);

    expect(useEyeComfortStore.getState().isEnabled).toBe(false);
    expect(
      screen.getByTestId("eye-comfort-header-button").props
        .accessibilityState,
    ).toEqual({ selected: false });
  });
});
