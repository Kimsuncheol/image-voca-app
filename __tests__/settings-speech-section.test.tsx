import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getDoc, setDoc } from "firebase/firestore";
import React from "react";
import { SpeechSection } from "../components/settings/SpeechSection";
import {
  __resetSpeechPreferencesForTests,
  getSpeechSpeedPreferences,
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
  "settings.speech.title": "Pronunciation Speed",
  "settings.speech.englishSpeed": "English pronunciation speed",
  "settings.speech.japaneseSpeed": "Japanese pronunciation speed",
  "settings.speech.slow": "Slow",
  "settings.speech.normal": "Normal",
  "settings.speech.fast": "Fast",
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

  it("shows only the English speed control for English learners", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("English pronunciation speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("Japanese pronunciation speed")).toBeNull();
  });

  it("shows only the Japanese speed control for Japanese learners", async () => {
    mockUseLearningLanguage.mockReturnValue({
      learningLanguage: "ja",
    });

    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Japanese pronunciation speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("English pronunciation speed")).toBeNull();
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
});
