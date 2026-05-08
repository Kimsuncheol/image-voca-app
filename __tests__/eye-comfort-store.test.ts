import AsyncStorage from "@react-native-async-storage/async-storage";
import { waitFor } from "@testing-library/react-native";
import {
  DEFAULT_EYE_COMFORT_SNAPSHOT,
  EYE_COMFORT_STORAGE_KEY,
  __resetEyeComfortStoreForTests,
  useEyeComfortStore,
} from "../src/stores/eyeComfortStore";

describe("eye comfort store", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetEyeComfortStoreForTests();
    jest.clearAllMocks();
  });

  afterEach(() => {
    __resetEyeComfortStoreForTests();
  });

  it("hydrates defaults when no settings are stored", async () => {
    await expect(useEyeComfortStore.getState().hydrate()).resolves.toEqual(
      DEFAULT_EYE_COMFORT_SNAPSHOT,
    );

    expect(useEyeComfortStore.getState()).toEqual(
      expect.objectContaining({
        ...DEFAULT_EYE_COMFORT_SNAPSHOT,
        _initialized: true,
      }),
    );
  });

  it("falls back safely when stored settings are invalid", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await AsyncStorage.setItem(EYE_COMFORT_STORAGE_KEY, "{bad-json");

    await expect(useEyeComfortStore.getState().hydrate()).resolves.toEqual(
      DEFAULT_EYE_COMFORT_SNAPSHOT,
    );

    warnSpy.mockRestore();
  });

  it("hydrates old settings without custom intensity", async () => {
    await AsyncStorage.setItem(
      EYE_COMFORT_STORAGE_KEY,
      JSON.stringify({ level: "high", isEnabled: true }),
    );

    await expect(useEyeComfortStore.getState().hydrate()).resolves.toEqual({
      level: "high",
      customIntensity: 50,
      isEnabled: true,
    });
  });

  it("falls back when stored custom intensity is invalid", async () => {
    await AsyncStorage.setItem(
      EYE_COMFORT_STORAGE_KEY,
      JSON.stringify({
        level: "custom",
        customIntensity: "bright",
        isEnabled: true,
      }),
    );

    await expect(useEyeComfortStore.getState().hydrate()).resolves.toEqual({
      level: "custom",
      customIntensity: 50,
      isEnabled: true,
    });
  });

  it("persists setLevel, enable, disable, and toggle changes", async () => {
    const store = useEyeComfortStore.getState();

    store.enable();
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY),
      ).resolves.toContain('"isEnabled":true');
    });

    useEyeComfortStore.getState().setLevel("high");
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY),
      ).resolves.toContain('"level":"high"');
    });

    useEyeComfortStore.getState().disable();
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY),
      ).resolves.toContain('"isEnabled":false');
    });

    useEyeComfortStore.getState().toggle();
    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY),
      ).resolves.toContain('"isEnabled":true');
    });
  });

  it("sets custom intensity, switches to custom level, and persists", async () => {
    useEyeComfortStore.getState().setCustomIntensity(75);

    expect(useEyeComfortStore.getState()).toEqual(
      expect.objectContaining({
        level: "custom",
        customIntensity: 75,
      }),
    );

    await waitFor(async () => {
      await expect(
        AsyncStorage.getItem(EYE_COMFORT_STORAGE_KEY),
      ).resolves.toContain('"customIntensity":75');
    });
  });

  it("clamps custom intensity before saving", async () => {
    useEyeComfortStore.getState().setCustomIntensity(-20);
    expect(useEyeComfortStore.getState().customIntensity).toBe(0);

    useEyeComfortStore.getState().setCustomIntensity(140);
    expect(useEyeComfortStore.getState().customIntensity).toBe(100);
  });
});
