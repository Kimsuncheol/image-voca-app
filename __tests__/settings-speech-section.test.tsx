import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getDoc } from "firebase/firestore";
import React from "react";
import { SpeechSection } from "../components/settings/SpeechSection";
import {
  __resetSpeechPreferencesForTests,
  getVocabularySpeechPreferences,
} from "../src/services/speechPreferences";

const mockUseLearningLanguage = jest.fn();
const mockUseAuth = jest.fn();
const mockServerTimestamp = { __type: "serverTimestamp" };
const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

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
  "settings.speech.title": "Speech & Mask",
  "settings.speech.speed": "Speech speed",
  "settings.speech.englishSpeed": "English pronunciation speed",
  "settings.speech.japaneseSpeed": "Japanese pronunciation speed",
  "settings.speech.slow": "Slow",
  "settings.speech.normal": "Normal",
  "settings.speech.fast": "Fast",
  "settings.speech.autoVocabularySpeech": "Auto speech",
  "settings.speech.reviewMaskTarget": "Mask target",
  "settings.speech.maskTargets.word": "Word",
  "settings.speech.maskTargets.example": "Example",
  "settings.speech.maskTargets.meaning": "Meaning",
  "settings.speech.maskTargets.reading": "Reading",
  "settings.speech.maskTargets.synonym": "Synonym",
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
  optionRight: { flexDirection: "row", alignItems: "center" },
  optionText: { fontSize: 17 },
  optionValue: { fontSize: 15 },
  separator: { height: 1, backgroundColor: "#d1d1d6", marginLeft: 52 },
};

describe("SpeechSection", () => {
  const mockGetDoc = getDoc as jest.Mock;

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
    mockRouterPush.mockReset();
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
      expect(screen.getByText("Speech & Mask")).toBeTruthy();
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("Speech")).toBeNull();
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
      expect(screen.getByText("Speech & Mask")).toBeTruthy();
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByText("Speech")).toBeNull();
    expect(screen.queryByText("Pronunciation Speed")).toBeNull();
    expect(screen.queryByText("Pronunciation speed")).toBeNull();
    expect(screen.queryByText("English pronunciation speed")).toBeNull();
    expect(screen.queryByText("Japanese pronunciation speed")).toBeNull();
  });

  it("navigates to the speech speed screen from a summary row", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Normal")).toBeTruthy();
    });

    expect(screen.queryByTestId("speech-speed-preset-toggle")).toBeNull();

    fireEvent.press(screen.getByTestId("settings-speech-speed-row"));

    expect(mockRouterPush).toHaveBeenCalledWith("/settings-speech-speed");
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
      reviewMaskTarget: "word",
    });
  });

  it("renders standard dividers between speech settings rows", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Speech speed")).toBeTruthy();
      expect(screen.getByText("Auto speech")).toBeTruthy();
      expect(screen.getByText("Mask target")).toBeTruthy();
    });

    const separators = screen.getAllByTestId("speech-section-separator");
    expect(separators).toHaveLength(2);
    separators.forEach((separator) => {
      expect(separator.props.style).toBe(styles.separator);
    });
  });

  it("navigates to the review mask target screen from a summary row", async () => {
    const screen = render(<SpeechSection styles={styles} isDark={false} />);

    await waitFor(() => {
      expect(screen.getByText("Mask target")).toBeTruthy();
      expect(screen.getByText("Word")).toBeTruthy();
    });

    expect(screen.queryByTestId("review-mask-target-selector")).toBeNull();
    expect(screen.queryByTestId("review-mask-target-meaning")).toBeNull();

    fireEvent.press(screen.getByTestId("settings-review-mask-target-row"));

    expect(mockRouterPush).toHaveBeenCalledWith(
      "/settings-review-mask-target",
    );
  });
});
