import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { doc, runTransaction } from "firebase/firestore";
import React from "react";
import { Alert, StyleSheet } from "react-native";
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

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name, testID }: { name: string; testID?: string }) => (
      <Text testID={testID}>{name}</Text>
    ),
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
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
        imageUrl: "https://cdn.example.com/collocation.png",
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
    const writtenWord = transaction.set.mock.calls[0][1].words[0];
    expect(writtenWord).not.toHaveProperty("day");
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

  it("uses the tight content top inset for the image content area", () => {
    const screen = render(buildFaceSide());
    const imageFrame = screen.getByTestId("collocation-card-image-frame");
    const image = screen.getByTestId("mock-expo-image");
    const imageFrameStyle = StyleSheet.flatten(imageFrame.props.style);
    const imageStyle = StyleSheet.flatten(image.props.style);

    expect(imageFrameStyle).toEqual(
      expect.objectContaining({
        marginHorizontal: 4,
        marginTop: 0,
      }),
    );
    expect(imageStyle).toEqual(
      expect.objectContaining({
        bottom: 0,
        left: 0,
        position: "absolute",
        right: 0,
        top: 0,
      }),
    );
  });

  it("renders the face mask toggle without flipping the card", () => {
    const onFlip = jest.fn();
    const onMaskChange = jest.fn();
    const stopPropagation = jest.fn();
    const screen = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
          imageUrl: "https://cdn.example.com/collocation.png",
        }}
        isDark={false}
        onFlip={onFlip}
        isReviewMode={false}
        onMaskChange={onMaskChange}
      />,
    );
    const renderedTree = JSON.stringify(screen.toJSON());

    expect(screen.getByTestId("collocation-face-mask-toggle-button")).toBeTruthy();
    expect(screen.getByText("Mask")).toBeTruthy();
    expect(renderedTree).not.toContain("mock_synonym_1");
    expect(renderedTree).not.toContain("mock_synonym_2");
    expect(screen.queryByTestId("collocation-face-synonyms-section")).toBeNull();
    expect(renderedTree.indexOf("make a decision")).toBeLessThan(
      renderedTree.indexOf("collocation-face-mask-toggle"),
    );

    fireEvent(
      screen.getByTestId("collocation-face-mask-toggle-button"),
      "press",
      { stopPropagation },
    );

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onMaskChange).toHaveBeenCalledWith(true);
    expect(onFlip).not.toHaveBeenCalled();
  });

  it("renders real collocation synonyms when provided", () => {
    const screen = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
          imageUrl: "https://cdn.example.com/collocation.png",
          synonyms: ["decide", " choose ", "", "resolve"],
        }}
        isDark={false}
      />,
    );

    expect(screen.getByTestId("collocation-face-synonyms-section")).toBeTruthy();
    expect(screen.getByTestId("collocation-face-synonyms").props.children).toBe(
      "decide, choose, resolve",
    );
  });

  it("masks collocation synonyms when configured", () => {
    const screen = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
          imageUrl: "https://cdn.example.com/collocation.png",
          synonyms: ["decide", "choose"],
        }}
        isDark={false}
        isReviewMode
        reviewMaskTarget="synonym"
      />,
    );

    expect(
      StyleSheet.flatten(screen.getByText("make a decision").props.style),
    ).not.toEqual(
      expect.objectContaining({
        color: "#ffffff",
        backgroundColor: "transparent",
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("collocation-face-synonyms").props.style),
    ).toEqual(
      expect.objectContaining({
        color: "#ffffff",
        backgroundColor: "transparent",
      }),
    );
  });

  it("masks collocation meaning instead of word when configured", () => {
    const screen = render(
      <FaceSide
        data={{
          collocation: "make a decision",
          meaning: "결정을 내리다",
          explanation: "",
          example: "She made a decision quickly.",
          translation: "그녀는 빨리 결정을 내렸다.",
          imageUrl: "https://cdn.example.com/collocation.png",
        }}
        isDark={false}
        isReviewMode
        reviewMaskTarget="meaning"
      />,
    );

    expect(StyleSheet.flatten(screen.getByText("make a decision").props.style)).not.toEqual(
      expect.objectContaining({
        color: "#ffffff",
        backgroundColor: "transparent",
      }),
    );
    expect(StyleSheet.flatten(screen.getByText("결정을 내리다").props.style)).toEqual(
      expect.objectContaining({
        color: "#ffffff",
        backgroundColor: "transparent",
      }),
    );
  });
});
