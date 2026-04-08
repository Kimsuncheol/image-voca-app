import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import {
  fetchCountersDataFromFirestore,
  getCountersCollectionPath,
  getCountersData,
} from "../../src/services/countersService";

const mockSetFirebaseOnline = jest.fn();
const mockSetFirebaseOffline = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../../src/stores/networkStore", () => ({
  useNetworkStore: {
    getState: () => ({
      setFirebaseOnline: mockSetFirebaseOnline,
      setFirebaseOffline: mockSetFirebaseOffline,
    }),
  },
}));

const buildSnapshot = (
  docs: { data: () => Record<string, unknown>; id: string }[],
) => ({
  docs,
  empty: docs.length === 0,
});

describe("countersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH =
      "/reference/jlpt/counters/doc/numbers";
    process.env.EXPO_PUBLIC_JLTP_COUNTER_COUNTER_TSUU_PATH =
      "/reference/jlpt/counters/doc/counter_tsuu";
    (collection as jest.Mock).mockImplementation((_db, path: string) => ({
      path,
    }));
  });

  it("resolves the env-backed collection path for a given tab", () => {
    expect(getCountersCollectionPath("numbers")).toBe(
      "reference/jlpt/counters/doc/numbers",
    );
    expect(getCountersCollectionPath("counter_tsuu")).toBe(
      "reference/jlpt/counters/doc/counter_tsuu",
    );
  });

  it("maps Firestore counter documents into the app shape and sorts by id", async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot([
        {
          id: "numbers-02",
          data: () => ({
            category: "Numbers",
            word: "二",
            example: "二つ",
            exampleRoman: "futatsu",
            meaningEnglish: "two",
            meaningKorean: "둘",
            pronunciation: "に",
            pronunciationRoman: "ni",
            translationEnglish: "two items",
            translationKorean: "두 개",
          }),
        },
        {
          id: "numbers-01",
          data: () => ({
            category: "Numbers",
            word: "一",
            example: "一つ",
            exampleRoman: "hitotsu",
            meaningEnglish: "one",
            meaningKorean: "하나",
            pronunciation: "いち",
            pronunciationRoman: "ichi",
            translationEnglish: "one item",
            translationKorean: "한 개",
          }),
        },
      ]),
    );

    const result = await fetchCountersDataFromFirestore("numbers");

    expect(result).toEqual([
      expect.objectContaining({
        id: "numbers-01",
        word: "一",
      }),
      expect.objectContaining({
        id: "numbers-02",
        word: "二",
      }),
    ]);
  });

  it("returns remote data and marks Firebase online on success", async () => {
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot([
        {
          id: "numbers-01",
          data: () => ({
            category: "Numbers",
            word: "一",
          }),
        },
      ]),
    );

    const result = await getCountersData("numbers");

    expect(result[0].word).toBe("一");
    expect(mockSetFirebaseOnline).toHaveBeenCalled();
    expect(mockSetFirebaseOffline).not.toHaveBeenCalled();
  });

  it("throws when a tab Firestore path is missing", async () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;

    await expect(getCountersData("numbers")).rejects.toThrow(
      "Missing or invalid EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH",
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("throws when Firestore read fails", async () => {
    (getDocs as jest.Mock).mockRejectedValue(
      new FirebaseError("unavailable", "Firestore unavailable"),
    );

    await expect(getCountersData("counter_tsuu")).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(mockSetFirebaseOffline).toHaveBeenCalledWith(true);
  });
});
