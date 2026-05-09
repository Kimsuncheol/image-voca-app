import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Brightness from "expo-brightness";
import { waitFor } from "@testing-library/react-native";
import {
  DEFAULT_READING_DISPLAY_SNAPSHOT,
  READING_DISPLAY_STORAGE_KEY,
  __resetReadingDisplayStoreForTests,
  useReadingDisplayStore,
} from "../src/stores/readingDisplayStore";

describe("reading display store", () => {
  const brightnessMock = Brightness as jest.Mocked<typeof Brightness>;

  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetReadingDisplayStoreForTests();
    jest.clearAllMocks();
    brightnessMock.getBrightnessAsync.mockResolvedValue(0.6);
    brightnessMock.setBrightnessAsync.mockResolvedValue(undefined);
    brightnessMock.restoreSystemBrightnessAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    __resetReadingDisplayStoreForTests();
  });

  it("hydrates defaults when no settings are stored", async () => {
    await expect(
      useReadingDisplayStore.getState().hydrate(),
    ).resolves.toEqual(DEFAULT_READING_DISPLAY_SNAPSHOT);

    expect(useReadingDisplayStore.getState()).toEqual(
      expect.objectContaining({
        ...DEFAULT_READING_DISPLAY_SNAPSHOT,
        _initialized: true,
      }),
    );
  });

  it("falls back safely when stored settings are invalid", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await AsyncStorage.setItem(READING_DISPLAY_STORAGE_KEY, "{bad-json");

    await expect(
      useReadingDisplayStore.getState().hydrate(),
    ).resolves.toEqual(DEFAULT_READING_DISPLAY_SNAPSHOT);

    warnSpy.mockRestore();
  });

  it("normalizes invalid and out-of-range stored values", async () => {
    await AsyncStorage.setItem(
      READING_DISPLAY_STORAGE_KEY,
      JSON.stringify({
        brightnessMode: "manual",
        appBrightness: 4,
        eyeComfortEnabled: "yes",
        eyeComfortIntensity: -1,
        isDisplayModalOpen: "open",
      }),
    );

    await expect(
      useReadingDisplayStore.getState().hydrate(),
    ).resolves.toEqual({
      brightnessMode: "system",
      appBrightness: 1,
      eyeComfortEnabled: false,
      eyeComfortIntensity: 0.04,
      isDisplayModalOpen: false,
    });
  });

  it("persists brightness, eye comfort, intensity, and modal state", async () => {
    useReadingDisplayStore.getState().setBrightnessMode("app");
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(READING_DISPLAY_STORAGE_KEY),
      ).resolves.toContain('"brightnessMode":"app"');
    });

    useReadingDisplayStore.getState().setAppBrightness(0.42);
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(READING_DISPLAY_STORAGE_KEY),
      ).resolves.toContain('"appBrightness":0.42');
    });

    useReadingDisplayStore.getState().setEyeComfortEnabled(true);
    useReadingDisplayStore.getState().setEyeComfortIntensity(0.18);
    useReadingDisplayStore.getState().openDisplayModal();
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(
        READING_DISPLAY_STORAGE_KEY,
      );
      expect(stored).toContain('"eyeComfortEnabled":true');
      expect(stored).toContain('"eyeComfortIntensity":0.18');
      expect(stored).toContain('"isDisplayModalOpen":true');
    });

    useReadingDisplayStore.getState().closeDisplayModal();
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(READING_DISPLAY_STORAGE_KEY),
      ).resolves.toContain('"isDisplayModalOpen":false');
    });
  });

  it("clamps brightness and intensity", () => {
    useReadingDisplayStore.getState().setAppBrightness(0);
    expect(useReadingDisplayStore.getState().appBrightness).toBe(0.05);

    useReadingDisplayStore.getState().setAppBrightness(2);
    expect(useReadingDisplayStore.getState().appBrightness).toBe(1);

    useReadingDisplayStore.getState().setEyeComfortIntensity(0);
    expect(useReadingDisplayStore.getState().eyeComfortIntensity).toBe(0.04);

    useReadingDisplayStore.getState().setEyeComfortIntensity(1);
    expect(useReadingDisplayStore.getState().eyeComfortIntensity).toBe(0.3);
  });

  it("does not apply app brightness while brightness scope is inactive", async () => {
    useReadingDisplayStore.getState().setBrightnessMode("app");

    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(READING_DISPLAY_STORAGE_KEY),
      ).resolves.toContain('"brightnessMode":"app"');
    });
    expect(brightnessMock.setBrightnessAsync).not.toHaveBeenCalled();
  });

  it("applies app brightness when brightness scope becomes active", async () => {
    useReadingDisplayStore.getState().setBrightnessMode("app");
    brightnessMock.setBrightnessAsync.mockClear();

    useReadingDisplayStore.getState().setBrightnessScopeActive(true);

    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.8);
    });
  });

  it("restores brightness when brightness scope becomes inactive", async () => {
    useReadingDisplayStore.getState().setBrightnessScopeActive(true);
    useReadingDisplayStore.getState().setBrightnessMode("app");
    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.8);
    });
    brightnessMock.setBrightnessAsync.mockClear();

    useReadingDisplayStore.getState().setBrightnessScopeActive(false);

    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.6);
      expect(brightnessMock.restoreSystemBrightnessAsync).toHaveBeenCalled();
    });
  });

  it("applies app brightness changes immediately only while scope is active", async () => {
    useReadingDisplayStore.getState().setBrightnessMode("app");
    useReadingDisplayStore.getState().setAppBrightness(0.5);
    expect(brightnessMock.setBrightnessAsync).not.toHaveBeenCalled();

    useReadingDisplayStore.getState().setBrightnessScopeActive(true);
    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.5);
    });
    brightnessMock.setBrightnessAsync.mockClear();

    useReadingDisplayStore.getState().setAppBrightness(0.7);
    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.7);
    });
  });

  it("restores system brightness mode while scope is active", async () => {
    useReadingDisplayStore.getState().setBrightnessScopeActive(true);
    useReadingDisplayStore.getState().setBrightnessMode("app");
    await waitFor(() => {
      expect(brightnessMock.setBrightnessAsync).toHaveBeenCalledWith(0.8);
    });

    useReadingDisplayStore.getState().setBrightnessMode("system");

    await waitFor(() => {
      expect(brightnessMock.restoreSystemBrightnessAsync).toHaveBeenCalled();
    });
  });
});
