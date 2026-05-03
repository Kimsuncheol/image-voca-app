import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getDoc, setDoc } from "firebase/firestore";
import React from "react";
import { Alert, StyleSheet } from "react-native";
import { FontSizes } from "../constants/fontSizes";
import { SpeechSection } from "../components/settings/SpeechSection";
import {
  __resetSpeechPreferencesForTests,
  getSpeechSpeedPreferences,
  getVocabularySpeechPreferences,
  setSpeechSpeedPreference,
} from "../src/services/speechPreferences";

const mockUseLearningLanguage = jest.fn();
const mockUseAuth = jest.fn();
const mockServerTimestamp = { __type: "serverTimestamp" };

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => mockUseLearningLanguage(),
}));

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../src/services/firebase", () => ({
  db: { app: "mock-db" },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, ...pathSegments) => ({ pathSegments })),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => mockServerTimestamp),
  setDoc: jest.fn(),
}));

const translations: Record<string, string> = {
  "settings.speech.title": "Speech",
  "settings.speech.speed": "Speech speed",
  "settings.speech.englishSpeed": "English pronunciation speed",
  "settings.speech.japaneseSpeed": "Japanese pronunciation speed",
  "settings.speech.slow": "Slow",
  "settings.speech.normal": "Normal",
  "settings.speech.fast": "Fast",
  "settings.speech.autoVocabularySpeech": "Auto speech",
  "settings.speech.reviewMaskTarget": "Review mask target",
  "settings.speech.maskTargets.word-pronunciation": "Word + pronunciation",
  "settings.speech.maskTargets.meaning": "Meaning",
  "settings.speech.maskTargets.all": "All",
  "settings.speech.saveFailed":
    "Speech speed changed for now, but could not be saved on this device.",
  "common.error": "Error",
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

const styles = {
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14 },
  card: { borderRadius: 10 },
  option: { flexDirection: "row", justifyContent: "space-between" },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionText: { fontSize: 17 },
  separator: { height: 1, backgroundColor: "#d1d1d6", marginLeft: 52 },
};

describe("SpeechSection", () => {
  const mockGetDoc = getDoc as jest.Mock;
  const mockSetDoc = setDoc as jest.Mock;

  beforeEach(async () => {
    __resetSpeechPreferencesForTests();
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUseLearningLanguage.mockReturnValue({
      learningLanguage: "en",
    });
    mockUseAuth.mockReturnValue({
      user: null,
    });
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });
  });

  afterEach(() => {
    __resetSpeechPreferencesForTests();
  });

  it("shows the shared speed control label for English learners", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech")).toBeTruthy();
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("Pronunciation Speed")).toBeNull();
    expect(screen.queryByText("Pronunciation speed")).toBeNull();
    expect(screen.queryByText("English pronunciation speed")).toBeNull();
    expect(screen.queryByText("Japanese pronunciation speed")).toBeNull();
  });

  it("shows the shared speed control label for Japanese learners", async () => {
    mockUseLearningLanguage.mockReturnValue({
      learningLanguage: "ja",
    });

    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech")).toBeTruthy();
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("Pronunciation Speed")).toBeNull();
    expect(screen.queryByText("Pronunciation speed")).toBeNull();
    expect(screen.queryByText("English pronunciation speed")).toBeNull();
    expect(screen.queryByText("Japanese pronunciation speed")).toBeNull();
  });

  it("persists preset changes for only the visible language", async () => {
    await setSpeechSpeedPreference("ja", "slow");
    __resetSpeechPreferencesForTests();
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Fast")).toBeTruthy();
    });
    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "slow",
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Slow")).toBeTruthy();
    });
    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "slow",
      ja: "slow",
    });
  });

  it("preserves the hidden language preset when selecting normal", async () => {
    mockUseLearningLanguage.mockReturnValue({
      learningLanguage: "ja",
    });
    await setSpeechSpeedPreference("en", "fast");
    await setSpeechSpeedPreference("ja", "slow");
    __resetSpeechPreferencesForTests();
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Slow")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Normal")).toBeTruthy();
    });
    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "fast",
      ja: "normal",
    });
  });

  it("cycles the visible preset from normal to fast to slow to normal", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));
    await waitFor(() => {
      expect(screen.getByText("Fast")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));
    await waitFor(() => {
      expect(screen.getByText("Slow")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));
    await waitFor(() => {
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(await getSpeechSpeedPreferences()).toEqual({
      en: "normal",
      ja: "normal",
    });
  });

  it("syncs the visible language preset to Firestore when signed in", async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
    });
    await setSpeechSpeedPreference("ja", "slow");
    __resetSpeechPreferencesForTests();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ en: "normal", ja: "slow" }),
    });
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Fast")).toBeTruthy();
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

  it("updates the visible preset and shows an alert when local persistence fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const setItemSpy = jest
      .spyOn(AsyncStorage, "setItem")
      .mockRejectedValueOnce(new Error("database or disk is full (code 13 SQLITE_FULL[13])"));
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("speech-speed-preset-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Fast")).toBeTruthy();
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Error",
        "Speech speed changed for now, but could not be saved on this device.",
      );
    });

    setItemSpy.mockRestore();
    alertSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("shows vocabulary auto speech enabled by default and toggles it off", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Auto speech")).toBeTruthy();
    });

    const autoSpeechSwitch = screen.getByRole("switch");
    expect(autoSpeechSwitch.props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });

    fireEvent.press(autoSpeechSwitch);

    await waitFor(() => {
      expect(screen.getByRole("switch").props.accessibilityState).toEqual({
        checked: false,
        disabled: false,
      });
    });
    await expect(getVocabularySpeechPreferences()).resolves.toEqual({
      autoSpeakVocabulary: false,
      reviewMaskTarget: "word-pronunciation",
    });
  });

  it("renders standard dividers between speech settings rows", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Auto speech")).toBeTruthy();
      expect(screen.getByText("Review mask target")).toBeTruthy();
    });

    const separators = screen.getAllByTestId("speech-section-separator");
    expect(separators).toHaveLength(2);
    separators.forEach((separator) => {
      expect(separator.props.style).toBe(styles.separator);
    });
  });

  it("selects the review mask target from vertical text options", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Review mask target")).toBeTruthy();
      expect(screen.getByText("Word + pronunciation")).toBeTruthy();
      expect(screen.getByText("Meaning")).toBeTruthy();
      expect(screen.getByText("All")).toBeTruthy();
      expect(
        screen.getByTestId("review-mask-target-word-pronunciation").props
          .accessibilityState,
      ).toEqual({ selected: true });
    });

    const selectorStyle = StyleSheet.flatten(
      screen.getByTestId("review-mask-target-selector").props.style,
    );
    expect(selectorStyle.flexDirection).toBe("column");
    expect(selectorStyle.paddingLeft).toBe(32);
    expect(selectorStyle.borderWidth).toBeUndefined();
    expect(selectorStyle.backgroundColor).toBeUndefined();

    const optionDividers = screen.getAllByTestId(
      "review-mask-target-option-divider",
    );
    expect(optionDividers).toHaveLength(2);
    optionDividers.forEach((divider) => {
      const dividerStyle = StyleSheet.flatten(divider.props.style);
      expect(dividerStyle.height).toBe(StyleSheet.hairlineWidth);
      expect(dividerStyle.backgroundColor).toBe("#d1d1d6");
    });

    const defaultOptionStyle = StyleSheet.flatten(
      screen.getByTestId("review-mask-target-word-pronunciation").props.style,
    );
    expect(defaultOptionStyle.backgroundColor).toBeUndefined();
    const defaultOptionTextStyle = StyleSheet.flatten(
      screen.getByText("Word + pronunciation").props.style,
    );
    expect(defaultOptionTextStyle.color).toBe("#007AFF");
    expect(defaultOptionTextStyle.fontSize).toBe(FontSizes.bodyLg);

    fireEvent.press(screen.getByTestId("review-mask-target-meaning"));

    await waitFor(() => {
      expect(
        screen.getByTestId("review-mask-target-meaning").props
          .accessibilityState,
      ).toEqual({ selected: true });
    });
    const meaningTextStyle = StyleSheet.flatten(
      screen.getByText("Meaning").props.style,
    );
    expect(meaningTextStyle.color).toBe("#007AFF");
    expect(meaningTextStyle.fontSize).toBe(FontSizes.bodyLg);
    expect(StyleSheet.flatten(screen.getByText("All").props.style).color).toBe(
      "#1f2937",
    );
    await expect(getVocabularySpeechPreferences()).resolves.toEqual({
      autoSpeakVocabulary: true,
      reviewMaskTarget: "meaning",
    });
  });
});
