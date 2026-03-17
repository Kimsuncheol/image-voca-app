import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { Alert, TouchableOpacity } from "react-native";
import { SwipeCardItemAddToWordBankButton } from "../components/swipe/SwipeCardItemAddToWordBankButton";
import { VocabularyCard } from "../src/types/vocabulary";

const mockRecordWordLearned = jest.fn();
const mockDoc = doc as jest.Mock;
const mockRunTransaction = runTransaction as jest.Mock;
const mockOnSavedWordChange = jest.fn();
let mockUser: { uid: string } | null = { uid: "user-1" };

jest.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
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

function buildItem(overrides: Partial<VocabularyCard> = {}): VocabularyCard {
  return {
    id: "1",
    word: "abandon",
    meaning: "to leave behind",
    translation: "버리다",
    pronunciation: "/əˈbændən/",
    pronunciationRoman: "eo-baen-deon",
    example: "They abandoned the plan.",
    course: "TOEIC",
    localized: {
      en: {
        meaning: "to leave behind",
        pronunciation: "uh-BAN-duhn",
        translation: "to give up",
      },
      ko: {
        meaning: "버리다",
        pronunciation: "어밴던",
        translation: "포기하다",
      },
    },
    ...overrides,
  };
}

function createTransactionMock(existingWords: Array<{ id: string }> = []) {
  return {
    get: jest.fn(async () => ({
      exists: () => existingWords.length > 0,
      data: () => ({ words: existingWords }),
    })),
    set: jest.fn(),
  };
}

describe("SwipeCardItemAddToWordBankButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: "user-1" };
    mockDoc.mockReturnValue("word-ref");
    mockOnSavedWordChange.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adds a word without showing an alert and syncs saved state", async () => {
    const transaction = createTransactionMock();
    mockRunTransaction.mockImplementation(async (_db, handler) =>
      handler(transaction),
    );
    mockRecordWordLearned.mockResolvedValue(undefined);

    const screen = render(
      <SwipeCardItemAddToWordBankButton
        item={buildItem()}
        isDark={false}
        day={3}
        onSavedWordChange={mockOnSavedWordChange}
      />,
    );

    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

    await waitFor(() => {
      expect(mockRunTransaction).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockRecordWordLearned).toHaveBeenCalledWith("user-1");
      expect(mockOnSavedWordChange).toHaveBeenCalledWith("1", true);
      expect(screen.getByText("bookmark")).toBeTruthy();
    });

    expect(transaction.set).toHaveBeenCalledWith(
      "word-ref",
      {
        words: [
          expect.objectContaining({
            pronunciationRoman: "eo-baen-deon",
            localized: {
              en: expect.objectContaining({
                meaning: "to leave behind",
              }),
              ko: expect.objectContaining({
                meaning: "버리다",
              }),
            },
          }),
        ],
      },
      { merge: true },
    );

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("removes an already-saved word without showing an info alert", async () => {
    const transaction = createTransactionMock([{ id: "1" }]);
    mockRunTransaction.mockImplementation(async (_db, handler) =>
      handler(transaction),
    );

    const screen = render(
      <SwipeCardItemAddToWordBankButton
        item={buildItem()}
        isDark={false}
        initialIsSaved={true}
        onSavedWordChange={mockOnSavedWordChange}
      />,
    );

    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

    await waitFor(() => {
      expect(mockOnSavedWordChange).toHaveBeenCalledWith("1", false);
      expect(screen.getByText("bookmark-outline")).toBeTruthy();
    });

    expect(mockRecordWordLearned).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "common.info",
      "swipe.errors.alreadyAdded",
    );
  });

  it("shows the login-required alert when the user is signed out", async () => {
    mockUser = null;

    const screen = render(
      <SwipeCardItemAddToWordBankButton item={buildItem()} isDark={false} />,
    );

    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

    expect(Alert.alert).toHaveBeenCalledWith(
      "common.error",
      "swipe.errors.loginRequired",
    );
    expect(mockRunTransaction).not.toHaveBeenCalled();
    expect(mockOnSavedWordChange).not.toHaveBeenCalled();
  });

  it("shows the add-failed alert when the transaction throws", async () => {
    mockRunTransaction.mockRejectedValue(new Error("firestore failed"));

    const screen = render(
      <SwipeCardItemAddToWordBankButton item={buildItem()} isDark={false} />,
    );

    fireEvent.press(screen.UNSAFE_getByType(TouchableOpacity));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "common.error",
        "swipe.errors.addFailed",
      );
    });

    expect(mockRecordWordLearned).not.toHaveBeenCalled();
    expect(mockOnSavedWordChange).not.toHaveBeenCalled();
  });
});
