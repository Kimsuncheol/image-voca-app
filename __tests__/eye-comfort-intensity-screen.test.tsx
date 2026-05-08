import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import EyeComfortIntensityScreen from "../app/settings/eye-comfort-intensity";
import {
  __resetEyeComfortStoreForTests,
  useEyeComfortStore,
} from "../src/stores/eyeComfortStore";

const mockStackScreen = jest.fn();
let mockIsDark = false;

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Ionicons = ({ name, testID }: { name: string; testID?: string }) => (
    <Text testID={testID ?? `icon-${name}`}>{name}</Text>
  );
  Ionicons.glyphMap = {};

  return { Ionicons };
});

jest.mock("expo-router", () => ({
  Stack: {
    Screen: (props: any) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      ({
        "settings.eyeComfort.intensity": "Intensity",
        "settings.eyeComfort.intensityTitle": "Eye Comfort Intensity",
        "settings.eyeComfort.levels.low": "Low",
        "settings.eyeComfort.levels.medium": "Medium",
        "settings.eyeComfort.levels.high": "High",
        "settings.eyeComfort.levels.custom": "Customize",
        "settings.eyeComfort.customIntensity": "Custom intensity",
      })[key] ??
      options?.defaultValue ??
      key,
  }),
}));

jest.mock("../components/ads/TopBannerAd", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    TopBannerAd: ({ includeTopInset }: { includeTopInset: boolean }) => (
      <Text testID="top-banner-ad">{String(includeTopInset)}</Text>
    ),
  };
});

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    isDark: mockIsDark,
  }),
}));

describe("EyeComfortIntensityScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockIsDark = false;
    __resetEyeComfortStoreForTests();
    useEyeComfortStore.setState({
      isEnabled: true,
      level: "medium",
      customIntensity: 50,
      _initialized: true,
    });
  });

  it("renders levels and checks the selected level", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    expect(screen.getByText("Low")).toBeTruthy();
    expect(screen.getByText("Medium")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();
    expect(screen.getByText("Customize")).toBeTruthy();
    expect(
      screen.getByTestId("eye-comfort-intensity-check-medium"),
    ).toBeTruthy();
  });

  it("hides the custom slider for preset levels", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    expect(screen.queryByTestId("eye-comfort-custom-slider")).toBeNull();
  });

  it("updates the global eye comfort level immediately", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    fireEvent.press(screen.getByTestId("eye-comfort-intensity-option-high"));

    expect(useEyeComfortStore.getState().level).toBe("high");
    expect(screen.getByTestId("eye-comfort-intensity-check-high")).toBeTruthy();
    expect(screen.queryByTestId("eye-comfort-custom-slider")).toBeNull();
  });

  it("mounts the slider and updates custom intensity immediately", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    fireEvent.press(screen.getByTestId("eye-comfort-intensity-option-custom"));

    expect(useEyeComfortStore.getState().level).toBe("custom");
    expect(screen.getByTestId("eye-comfort-custom-slider")).toBeTruthy();

    fireEvent(
      screen.getByTestId("eye-comfort-custom-slider-track"),
      "layout",
      {
        nativeEvent: { layout: { width: 100 } },
      },
    );
    fireEvent.press(screen.getByTestId("eye-comfort-custom-slider-track"), {
      nativeEvent: { locationX: 80 },
    });

    expect(useEyeComfortStore.getState()).toEqual(
      expect.objectContaining({
        level: "custom",
        customIntensity: 80,
      }),
    );
    expect(
      screen.getByTestId("eye-comfort-custom-slider-value").props.children,
    ).toEqual([80, "%"]);
  });

  it("drags the thumb using absolute track coordinates without snapping to zero", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    fireEvent.press(screen.getByTestId("eye-comfort-intensity-option-custom"));
    fireEvent(
      screen.getByTestId("eye-comfort-custom-slider-track"),
      "layout",
      {
        nativeEvent: { layout: { width: 100 } },
      },
    );

    const thumb = screen.getByTestId("eye-comfort-custom-slider-thumb");
    act(() => {
      thumb.props.testOnly_onThumbGrant(50);
      thumb.props.testOnly_onThumbMove(80);
    });

    expect(useEyeComfortStore.getState()).toEqual(
      expect.objectContaining({
        level: "custom",
        customIntensity: 80,
      }),
    );
  });

  it("clamps thumb drags before and after the track", () => {
    const screen = render(<EyeComfortIntensityScreen />);

    fireEvent.press(screen.getByTestId("eye-comfort-intensity-option-custom"));
    fireEvent(
      screen.getByTestId("eye-comfort-custom-slider-track"),
      "layout",
      {
        nativeEvent: { layout: { width: 100 } },
      },
    );

    const thumb = screen.getByTestId("eye-comfort-custom-slider-thumb");
    act(() => {
      thumb.props.testOnly_onThumbMove(-30);
    });
    expect(useEyeComfortStore.getState().customIntensity).toBe(0);

    act(() => {
      thumb.props.testOnly_onThumbMove(130);
    });
    expect(useEyeComfortStore.getState().customIntensity).toBe(100);
  });

  it("matches header and screen background in light mode", () => {
    const screen = render(<EyeComfortIntensityScreen />);
    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("eye-comfort-intensity-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );

    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });

  it("matches header and screen background in dark mode", () => {
    mockIsDark = true;
    const screen = render(<EyeComfortIntensityScreen />);
    const containerStyle = StyleSheet.flatten(
      screen.getByTestId("eye-comfort-intensity-screen").props.style,
    );
    const headerStyle = StyleSheet.flatten(
      mockStackScreen.mock.calls[0][0].options.headerStyle,
    );

    expect(headerStyle.backgroundColor).toBe(containerStyle.backgroundColor);
  });
});
