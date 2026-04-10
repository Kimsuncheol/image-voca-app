import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
  __resetSpeechPreferencesForTests,
  getDefaultSpeechSpeedPreset,
  getNextSpeechSpeedPreset,
  getSpeechPreferenceLanguage,
  getSpeechRatePreference,
  getSpeechRateForPreset,
  getSpeechSpeedPreferences,
  hydrateSpeechSpeedPreferencesForUser,
  resolveSpeechSpeedPreset,
  setSpeechSpeedPreference,
  setSpeechSpeedPreferenceForUser,
} from "../src/services/speechPreferences";

const mockServerTimestamp = { __type: "serverTimestamp" };

jest.mock("../src/services/firebase", () => ({
  db: { app: "mock-db" },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, ...pathSegments) => ({ pathSegments })),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => mockServerTimestamp),
  setDoc: jest.fn(),
}));

describe("speechPreferences", () => {
  const mockDoc = doc as jest.Mock;
  const mockGetDoc = getDoc as jest.Mock;
  const mockSetDoc = setDoc as jest.Mock;

  beforeEach(async () => {
    __resetSpeechPreferencesForTests();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    __resetSpeechPreferencesForTests();
  });

  it("loads default English and Japanese speech presets when storage is empty", async () => {
    await expect(getSpeechSpeedPreferences()).resolves.toEqual({
      en: "normal",
      ja: "normal",
    });
  });

  it("updates English and Japanese speech presets independently", async () => {
    await setSpeechSpeedPreference("en", "fast");

    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "normal",
    });

    await setSpeechSpeedPreference("ja", "slow");

    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "slow",
    });
  });

  it("migrates numeric legacy values to the nearest preset", async () => {
    await AsyncStorage.setItem(
      SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ en: 1.08, ja: 0.72 }),
    );
    __resetSpeechPreferencesForTests();

    await expect(getSpeechSpeedPreferences()).resolves.toEqual({
      en: "fast",
      ja: "slow",
    });
  });

  it("normalizes invalid stored values safely", async () => {
    await AsyncStorage.setItem(
      SPEECH_SPEED_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ en: "fast", ja: "fast-ish" }),
    );
    __resetSpeechPreferencesForTests();

    await expect(getSpeechSpeedPreferences()).resolves.toEqual({
      en: "fast",
      ja: "normal",
    });
  });

  it("maps speech language tags to preference languages", () => {
    expect(getSpeechPreferenceLanguage("en-US")).toBe("en");
    expect(getSpeechPreferenceLanguage("ja_JP")).toBe("ja");
    expect(getSpeechPreferenceLanguage("ko-KR")).toBeNull();
    expect(getSpeechPreferenceLanguage()).toBe("en");
  });

  it("exposes default presets and preset rates", async () => {
    expect(getDefaultSpeechSpeedPreset("en")).toBe("normal");
    expect(getDefaultSpeechSpeedPreset("ja")).toBe("normal");
    expect(getSpeechRateForPreset("en", "fast")).toBe(1.1);
    expect(getSpeechRateForPreset("ja", "slow")).toBe(0.7);
    expect(resolveSpeechSpeedPreset("en", 0.76)).toBe("slow");
    expect(resolveSpeechSpeedPreset("ja", 0.86)).toBe("normal");

    await setSpeechSpeedPreference("en", "fast");
    await setSpeechSpeedPreference("ja", "slow");
    await expect(getSpeechRatePreference("en")).resolves.toBe(1.1);
    await expect(getSpeechRatePreference("ja")).resolves.toBe(0.7);
  });

  it("cycles speech speed presets in the expected order", () => {
    expect(getNextSpeechSpeedPreset("slow")).toBe("normal");
    expect(getNextSpeechSpeedPreset("normal")).toBe("fast");
    expect(getNextSpeechSpeedPreset("fast")).toBe("slow");
  });

  it("hydrates signed-in preferences from Firestore and caches them locally", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ en: "fast", ja: "slow" }),
    });

    await expect(hydrateSpeechSpeedPreferencesForUser("user-1")).resolves.toEqual({
      en: "fast",
      ja: "slow",
    });

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      "users",
      "user-1",
      "pronunciation_speed",
      "preferences",
    );
    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "slow",
    });
  });

  it("creates the Firestore preference document when it is missing", async () => {
    await setSpeechSpeedPreference("en", "fast");
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    await expect(hydrateSpeechSpeedPreferencesForUser("user-1")).resolves.toEqual({
      en: "fast",
      ja: "normal",
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        pathSegments: ["users", "user-1", "pronunciation_speed", "preferences"],
      }),
      {
        en: "fast",
        ja: "normal",
        updatedAt: mockServerTimestamp,
      },
      { merge: true },
    );
  });

  it("syncs normalized local preferences to Firestore for signed-in users", async () => {
    await setSpeechSpeedPreference("ja", "slow");

    await expect(
      setSpeechSpeedPreferenceForUser("user-1", "en", "fast"),
    ).resolves.toEqual({
      en: "fast",
      ja: "slow",
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        pathSegments: ["users", "user-1", "pronunciation_speed", "preferences"],
      }),
      {
        en: "fast",
        ja: "slow",
        updatedAt: mockServerTimestamp,
      },
      { merge: true },
    );
  });

  it("keeps local preferences when Firestore sync fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockSetDoc.mockRejectedValue(new Error("offline"));

    await expect(
      setSpeechSpeedPreferenceForUser("user-1", "en", "fast"),
    ).resolves.toEqual({
      en: "fast",
      ja: "normal",
    });
    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "normal",
    });
    warnSpy.mockRestore();
  });
});
