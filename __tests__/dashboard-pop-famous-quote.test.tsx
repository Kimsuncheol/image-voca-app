import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, waitFor } from "@testing-library/react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import React from "react";
import { DashboardPopFamousQuote } from "../components/dashboard/DashboardPopFamousQuote";

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, path: string) => ({ path })),
  getDocs: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn((...args: unknown[]) => args),
}));

let mockAppLanguage = "en";
const mockLearningLanguageState = {
  learningLanguage: "ja" as "en" | "ja",
};

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: mockAppLanguage },
  }),
}));

jest.mock("../src/context/LearningLanguageContext", () => ({
  useLearningLanguage: () => mockLearningLanguageState,
}));

jest.mock("../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

const buildSnapshot = (data: Record<string, unknown>) => ({
  empty: false,
  docs: [
    {
      id: "quote-1",
      data: () => data,
    },
  ],
});

describe("DashboardPopFamousQuote", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockAppLanguage = "en";
    mockLearningLanguageState.learningLanguage = "ja";
  });

  it("renders the English translation for Japanese quotes when UI language is English", async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot({
        quote: "七転び八起き",
        translation: "Stumbling seven times but standing up eight",
        translationKorean: "일곱 번 넘어져도 여덟 번 일어난다",
        author: "",
        language: "Japanese",
      }),
    );

    const screen = render(<DashboardPopFamousQuote />);

    await waitFor(() => {
      expect(
        screen.getByText("Stumbling seven times but standing up eight"),
      ).toBeTruthy();
    });
    expect(screen.queryByText("일곱 번 넘어져도 여덟 번 일어난다")).toBeNull();
    expect(collection).toHaveBeenCalledWith({}, "famous_quote");
    expect(where).toHaveBeenCalledWith("language", "==", "Japanese");
    expect(query).toHaveBeenCalled();
  });

  it("renders the Korean translation for Japanese quotes when UI language is Korean", async () => {
    mockAppLanguage = "ko-KR";
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot({
        quote: "七転び八起き",
        translation: "Stumbling seven times but standing up eight",
        translationKorean: "일곱 번 넘어져도 여덟 번 일어난다",
        author: "",
        language: "Japanese",
      }),
    );

    const screen = render(<DashboardPopFamousQuote />);

    await waitFor(() => {
      expect(screen.getByText("일곱 번 넘어져도 여덟 번 일어난다")).toBeTruthy();
    });
    expect(
      screen.queryByText("Stumbling seven times but standing up eight"),
    ).toBeNull();
  });

  it("falls back to the default translation when Korean translation is missing", async () => {
    mockAppLanguage = "ko";
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot({
        quote: "七転び八起き",
        translation: "Stumbling seven times but standing up eight",
        author: "",
        language: "Japanese",
      }),
    );

    const screen = render(<DashboardPopFamousQuote />);

    await waitFor(() => {
      expect(
        screen.getByText("Stumbling seven times but standing up eight"),
      ).toBeTruthy();
    });
  });
});
