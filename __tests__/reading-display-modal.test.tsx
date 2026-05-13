import AsyncStorage from "@react-native-async-storage/async-storage";
import { HeaderHeightContext } from "@react-navigation/elements";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { ReadingDisplayModal } from "../src/components/common/ReadingDisplayModal";
import {
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

let mockIsDark = false;
let mockTheme: "light" | "dark" | "system" = "light";
const mockSetTheme = jest.fn();

jest.mock("@react-navigation/elements", () => {
  const React = require("react");

  return {
    HeaderHeightContext: React.createContext(undefined),
    getDefaultHeaderHeight: jest.fn(() => 56),
  };
});

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    isDark: mockIsDark,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      ({
        "readingDisplay.title": "Reading display",
        "readingDisplay.brightness": "Reading brightness",
        "readingDisplay.brightnessModes.system": "System",
        "readingDisplay.brightnessModes.app": "App",
        "readingDisplay.eyeComfort": "Eye comfort mode",
        "readingDisplay.eyeComfortScope": "Apply to",
        "readingDisplay.eyeComfortScopes.screen": "Entire screen",
        "readingDisplay.eyeComfortScopes.images": "Images only",
        "readingDisplay.intensity": "Intensity",
        "settings.appearance.title": "Appearance",
        "settings.appearance.light": "Light",
        "settings.appearance.dark": "Dark",
        "settings.appearance.system": "System",
      })[key] ??
      options?.defaultValue ??
      key,
  }),
}));

describe("ReadingDisplayModal", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetReadingDisplayStoreForTests();
    mockIsDark = false;
    mockTheme = "light";
    mockSetTheme.mockClear();
    useReadingDisplayStore.setState({
      _initialized: true,
      isDisplayModalOpen: true,
    });
  });

  it("renders and closes on outside press", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(screen.getByText("Reading display")).toBeTruthy();

    fireEvent.press(screen.getByTestId("reading-display-modal-overlay"));

    expect(useReadingDisplayStore.getState().isDisplayModalOpen).toBe(
      false,
    );
  });

  it("positions the panel below the header instead of bottom-aligning it", () => {
    const screen = render(
      <HeaderHeightContext.Provider value={0}>
        <ReadingDisplayModal />
      </HeaderHeightContext.Provider>,
    );
    const overlayStyle = StyleSheet.flatten(
      screen.getByTestId("reading-display-modal-overlay").props.style,
    );
    const panelStyle = StyleSheet.flatten(
      screen.getByTestId("reading-display-modal-panel").props.style,
    );

    expect(overlayStyle.justifyContent).toBeUndefined();
    expect(panelStyle.position).toBe("absolute");
    expect(panelStyle.top).toBe(48);
    expect(panelStyle.right).toBe(16);
    expect(panelStyle.left).toBe(16);
    expect(panelStyle.maxWidth).toBe(360);
  });

  it("does not render a drag handle and keeps eye comfort labels", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(screen.queryByTestId("reading-display-modal-handle")).toBeNull();
    expect(screen.getByText("Eye comfort mode")).toBeTruthy();
    expect(screen.getByText("Intensity")).toBeTruthy();
  });

  it("renders appearance controls and changes theme mode", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(screen.getByTestId("reading-display-appearance-label-light"))
      .toBeTruthy();
    expect(screen.getByTestId("reading-display-appearance-label-dark"))
      .toBeTruthy();
    expect(screen.getByTestId("reading-display-appearance-label-system"))
      .toBeTruthy();
    expect(screen.getByTestId("reading-display-system-preview-light"))
      .toBeTruthy();
    expect(screen.getByTestId("reading-display-system-preview-dark"))
      .toBeTruthy();
    expect(
      StyleSheet.flatten(
        screen.getByTestId("reading-display-appearance-preview-light").props
          .style,
      ),
    ).toEqual(
      expect.objectContaining({
        width: 62,
        height: 36,
        borderRadius: 10,
      }),
    );

    fireEvent.press(screen.getByTestId("reading-display-appearance-light"));
    expect(mockSetTheme).toHaveBeenLastCalledWith("light");

    fireEvent.press(screen.getByTestId("reading-display-appearance-dark"));
    expect(mockSetTheme).toHaveBeenLastCalledWith("dark");

    fireEvent.press(screen.getByTestId("reading-display-appearance-system"));
    expect(mockSetTheme).toHaveBeenLastCalledWith("system");
  });

  it("does not close when the panel is pressed", () => {
    const screen = render(<ReadingDisplayModal />);

    fireEvent.press(screen.getByTestId("reading-display-modal-panel"));

    expect(useReadingDisplayStore.getState().isDisplayModalOpen).toBe(
      true,
    );
  });

  it("toggles eye comfort from the modal", () => {
    const screen = render(<ReadingDisplayModal />);

    fireEvent.press(screen.getByRole("switch"));

    expect(useReadingDisplayStore.getState().eyeComfortEnabled).toBe(true);
  });

  it("selects the eye comfort scope from the modal", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(screen.getByText("Apply to")).toBeTruthy();
    expect(screen.getByText("Entire screen")).toBeTruthy();
    expect(screen.getByText("Images only")).toBeTruthy();
    expect(useReadingDisplayStore.getState().eyeComfortScope).toBe("screen");

    fireEvent.press(
      screen.getByTestId("reading-display-eye-comfort-scope-images"),
    );
    expect(useReadingDisplayStore.getState().eyeComfortScope).toBe("images");

    fireEvent.press(
      screen.getByTestId("reading-display-eye-comfort-scope-screen"),
    );
    expect(useReadingDisplayStore.getState().eyeComfortScope).toBe("screen");
  });

  it("dims and disables the intensity slider when eye comfort is off", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(
      screen.getByTestId("reading-display-eye-comfort-intensity-slider")
        .props.disabled,
    ).toBe(true);
  });

  it("updates eye comfort intensity immediately", () => {
    useReadingDisplayStore.setState({
      appBrightness: 0.55,
      eyeComfortEnabled: true,
      eyeComfortIntensity: 0.17,
    });
    const screen = render(<ReadingDisplayModal />);
    const intensitySlider = screen.getByTestId(
      "reading-display-eye-comfort-intensity-slider",
    );

    expect(intensitySlider.props.minimumValue).toBe(0);
    expect(intensitySlider.props.maximumValue).toBe(100);
    expect(intensitySlider.props.step).toBe(1);
    expect(screen.getByText("50%")).toBeTruthy();

    expect(
      StyleSheet.flatten(intensitySlider.props.style),
    ).toEqual(
      expect.objectContaining({
        transform: [{ scaleY: 1.0 }],
      }),
    );

    fireEvent(intensitySlider, "valueChange", 80);

    expect(useReadingDisplayStore.getState().eyeComfortIntensity).toBe(
      0.248,
    );
    expect(screen.getByText("80%")).toBeTruthy();
  });

  it("disables brightness slider in system mode and enables it in app mode", () => {
    const screen = render(<ReadingDisplayModal />);

    expect(
      StyleSheet.flatten(
        screen.getByTestId("reading-display-brightness-slider").props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        transform: [{ scaleY: 1.0 }],
      }),
    );
    expect(
      screen.getByTestId("reading-display-brightness-slider").props
        .disabled,
    ).toBe(true);

    fireEvent.press(
      screen.getByTestId("reading-display-brightness-mode-app"),
    );

    expect(
      screen.getByTestId("reading-display-brightness-slider").props
        .disabled,
    ).toBe(false);
  });

  it("updates app brightness immediately in app mode", () => {
    useReadingDisplayStore.setState({ brightnessMode: "app" });
    const screen = render(<ReadingDisplayModal />);

    fireEvent(
      screen.getByTestId("reading-display-brightness-slider"),
      "valueChange",
      0.55,
    );

    expect(useReadingDisplayStore.getState().appBrightness).toBe(0.55);
    expect(screen.getByText("55%")).toBeTruthy();
  });
});
