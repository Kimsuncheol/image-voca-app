import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { Alert } from "react-native";
import FaceSide from "../components/CollocationFlipCard/FaceSide";

const mockSpeak = jest.fn();
const mockRecordWordLearned = jest.fn();
const mockOnSavedStateChange = jest.fn();
const mockDoc = doc as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
let mockUser: { uid: string } | null = { uid: "user-1" };

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("../src/hooks/useSpeech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
  }),
}));

jest.mock("../src/stores", () => ({
  useUserStatsStore: () => ({
    recordWordLearned: mockRecordWordLearned,
  }),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function createTransactionMock(existingWords: Array<{ id: string }> = []) {
  return {
    get: jest.fn(async () => ({
      exists: () => existingWords.length > 0,
      data: () => ({ words: existingWords }),
    })),
    set: jest.fn(),
  };
}

function buildFaceSide(initialIsSaved = false) {
  return (
    <FaceSide
      data={{
        collocation: "make a decision",
        meaning: "결정을 내리다",
        explanation: "",
        example: "She made a decision quickly.",
        translation: "그녀는 빨리 결정을 내렸다.",
      }}
      isDark={false}
      wordBankConfig={{
        id: "1",
        course: "COLLOCATION",
        initialIsSaved,
        onSavedStateChange: mockOnSavedStateChange,
      }}
    />
  );
}

describe("Collocation FaceSide word bank toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: "user-1" };
    mockDoc.mockReturnValue("word-ref");
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adds a collocation and reports saved state without showing alerts", async () => {
    const transaction = createTransactionMock();
    mockRunTransaction.mockImplementation(async (_db, handler) =>
      handler(transaction),
    );
    mockRecordWordLearned.mockResolvedValue(undefined);

    const screen = render(buildFaceSide());

    fireEvent.press(screen.getByText("bookmark-outline"));

    await waitFor(() => {
      expect(mockRecordWordLearned).toHaveBeenCalledWith("user-1");
      expect(mockOnSavedStateChange).toHaveBeenCalledWith("1", true);
      expect(screen.getByText("bookmark")).toBeTruthy();
    });

    expect(Alert.alert).not.toHaveBeenCalledWith(
      "common.info",
      "swipe.errors.alreadyAdded",
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("removes a saved collocation and reports unsaved state without alerts", async () => {
    const transaction = createTransactionMock([{ id: "1" }]);
    mockRunTransaction.mockImplementation(async (_db, handler) =>
      handler(transaction),
    );

    const screen = render(buildFaceSide(true));

    fireEvent.press(screen.getByText("bookmark"));

    await waitFor(() => {
      expect(mockOnSavedStateChange).toHaveBeenCalledWith("1", false);
      expect(screen.getByText("bookmark-outline")).toBeTruthy();
    });

    expect(mockRecordWordLearned).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "common.info",
      "swipe.errors.alreadyAdded",
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
