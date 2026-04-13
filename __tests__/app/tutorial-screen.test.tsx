import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import React from "react";
import TutorialScreen from "../../app/tutorial";

const mockReplace = jest.fn();
const mockMarkTutorialCompleted = jest.fn();
const mockSetTutorialStatus = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: jest.fn(),
}));

jest.mock("../../src/context/ThemeContext", () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({ user: { uid: "user-1" } }),
}));

jest.mock("../../src/stores/tutorialStore", () => ({
  useTutorialStore: () => ({
    setTutorialStatus: mockSetTutorialStatus,
  }),
}));

jest.mock("../../src/services/userProfileService", () => ({
  markTutorialCompleted: (...args: unknown[]) =>
    mockMarkTutorialCompleted(...args),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const copy: Record<string, string> = {
        "tutorial.title": "Tutorial",
        "tutorial.skip": "Skip",
        "tutorial.next": "Next",
        "tutorial.getStarted": "Get Started",
        "tutorial.slides.dashboard.title": "Start from your dashboard",
        "tutorial.slides.dashboard.body": "Dashboard body",
        "tutorial.slides.days.title": "Choose a day and progress step by step",
        "tutorial.slides.days.body": "Days body",
        "tutorial.slides.vocabulary.title": "Learn by swiping through cards",
        "tutorial.slides.vocabulary.body": "Vocabulary body",
        "tutorial.slides.wordBank.title": "Revisit saved words in Word Bank",
        "tutorial.slides.wordBank.body": "Word bank body",
        "tutorial.slides.calendar.title": "Track your study history in Calendar",
        "tutorial.slides.calendar.body": "Calendar body",
        "tutorial.slides.elementaryJapanese.title":
          "Explore Elementary Japanese modules",
        "tutorial.slides.elementaryJapanese.body": "Elementary body",
      };

      return copy[key] ?? options?.defaultValue ?? key;
    },
  }),
}));

jest.mock("../../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

describe("TutorialScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
    mockMarkTutorialCompleted.mockResolvedValue("2026-04-14T00:00:00.000Z");
  });

  it("renders the first slide and advances through the tutorial", () => {
    const screen = render(<TutorialScreen />);

    expect(screen.getByText("Start from your dashboard")).toBeTruthy();
    expect(screen.getByText("1 / 6")).toBeTruthy();

    fireEvent.press(screen.getByText("Next"));

    expect(
      screen.getByText("Choose a day and progress step by step"),
    ).toBeTruthy();
    expect(screen.getByText("2 / 6")).toBeTruthy();
  });

  it("marks tutorial complete and routes to tabs when skipped", async () => {
    const screen = render(<TutorialScreen />);

    fireEvent.press(screen.getByText("Skip"));

    await waitFor(() => {
      expect(mockMarkTutorialCompleted).toHaveBeenCalledWith("user-1");
      expect(mockSetTutorialStatus).toHaveBeenCalledWith("completed");
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("marks tutorial complete from the final slide", async () => {
    const screen = render(<TutorialScreen />);

    fireEvent.press(screen.getByText("Next"));
    fireEvent.press(screen.getByText("Next"));
    fireEvent.press(screen.getByText("Next"));
    fireEvent.press(screen.getByText("Next"));
    fireEvent.press(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Get Started"));

    await waitFor(() => {
      expect(mockMarkTutorialCompleted).toHaveBeenCalledWith("user-1");
      expect(mockSetTutorialStatus).toHaveBeenCalledWith("completed");
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
