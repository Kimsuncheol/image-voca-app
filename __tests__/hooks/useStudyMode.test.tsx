import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import * as KeepAwake from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import React from "react";
import {
  __setStudyModeGetVolumeForTests,
  type StudyLanguageType,
  useStudyMode,
} from "../../src/hooks/useStudyMode";

const mockSpeak = jest.fn(async () => undefined);

jest.mock("../../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

function setPlatform(os: "android" | "ios") {
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: os,
  });
}

function StudyModeHarness({
  languageType = "EN",
  hideNavigationBar = false,
  text = "sample",
}: {
  languageType?: StudyLanguageType;
  hideNavigationBar?: boolean;
  text?: string;
}) {
  const { handleSpeech, lowVolumeHint } = useStudyMode("TestStudyScreen", {
    hideNavigationBar,
  });

  return (
    <View>
      <Pressable
        testID="speak"
        onPress={() => {
          void handleSpeech(text, languageType);
        }}
      >
        <Text>Speak</Text>
      </Pressable>
      {lowVolumeHint ? <Text testID="volume-hint">{lowVolumeHint}</Text> : null}
    </View>
  );
}

describe("useStudyMode", () => {
  const getVolumeMock = jest.fn(async () => ({ volume: 1 }));
  const activateKeepAwakeMock =
    KeepAwake.activateKeepAwakeAsync as jest.Mock;
  const deactivateKeepAwakeMock = KeepAwake.deactivateKeepAwake as jest.Mock;
  const setBehaviorMock = NavigationBar.setBehaviorAsync as jest.Mock;
  const setVisibilityMock = NavigationBar.setVisibilityAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    setPlatform("android");
    getVolumeMock.mockResolvedValue({ volume: 1 });
    __setStudyModeGetVolumeForTests(getVolumeMock);
  });

  it("keeps the screen awake without hiding the Android navigation bar by default", async () => {
    const screen = render(<StudyModeHarness />);

    await waitFor(() => {
      expect(activateKeepAwakeMock).toHaveBeenCalledWith("TestStudyScreen");
    });
    expect(setBehaviorMock).not.toHaveBeenCalled();
    expect(setVisibilityMock).not.toHaveBeenCalled();

    await act(async () => {
      screen.unmount();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(deactivateKeepAwakeMock).toHaveBeenCalledWith("TestStudyScreen");
    });
    expect(setBehaviorMock).not.toHaveBeenCalled();
    expect(setVisibilityMock).not.toHaveBeenCalled();
  });

  it("hides and restores the Android navigation bar when explicitly requested", async () => {
    const screen = render(<StudyModeHarness hideNavigationBar />);

    await waitFor(() => {
      expect(activateKeepAwakeMock).toHaveBeenCalledWith("TestStudyScreen");
      expect(setBehaviorMock).toHaveBeenCalledWith("overlay-swipe");
      expect(setVisibilityMock).toHaveBeenCalledWith("hidden");
    });

    await act(async () => {
      screen.unmount();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(deactivateKeepAwakeMock).toHaveBeenCalledWith("TestStudyScreen");
      expect(setVisibilityMock).toHaveBeenCalledWith("visible");
      expect(setBehaviorMock).toHaveBeenCalledWith("inset-touch");
    });
  });

  it("shows an alert and skips speech when device volume is muted", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    getVolumeMock.mockResolvedValue({ volume: 0 });
    const screen = render(<StudyModeHarness />);

    fireEvent.press(screen.getByTestId("speak"));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Volume is Muted",
        expect.stringContaining("increase the volume"),
      );
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it("shows Android toast for low volume and still speaks English", async () => {
    const toastSpy = jest.spyOn(ToastAndroid, "show").mockImplementation();
    getVolumeMock.mockResolvedValue({ volume: 0.1 });
    const screen = render(<StudyModeHarness languageType="EN" text="hello" />);

    fireEvent.press(screen.getByTestId("speak"));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringContaining("Device volume is low"),
        ToastAndroid.SHORT,
      );
      expect(mockSpeak).toHaveBeenCalledWith(
        "hello",
        expect.objectContaining({ language: "en-US" }),
      );
    });

    toastSpy.mockRestore();
  });

  it("shows a subtle hint for low non-Android volume and still speaks Japanese", async () => {
    setPlatform("ios");
    getVolumeMock.mockResolvedValue({ volume: 0.1 });
    const screen = render(<StudyModeHarness languageType="JP" text="日本語" />);

    fireEvent.press(screen.getByTestId("speak"));

    await waitFor(() => {
      expect(screen.getByTestId("volume-hint").props.children).toContain(
        "Device volume is low",
      );
      expect(mockSpeak).toHaveBeenCalledWith(
        "日本語",
        expect.objectContaining({ language: "ja-JP" }),
      );
    });
  });

  it("continues speaking when the native volume module is unavailable", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    __setStudyModeGetVolumeForTests(null);
    const screen = render(<StudyModeHarness languageType="EN" text="fallback" />);

    fireEvent.press(screen.getByTestId("speak"));

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("react-native-volume-manager not available"),
      );
      expect(mockSpeak).toHaveBeenCalledWith(
        "fallback",
        expect.objectContaining({ language: "en-US" }),
      );
    });

    warnSpy.mockRestore();
  });
});
