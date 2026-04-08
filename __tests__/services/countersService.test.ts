import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import {
  __resetCountersServiceForTests,
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
    __resetCountersServiceForTests();
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_JLPT_COUNTER_NUMBERS_PATH;
    delete process.env.EXPO_PUBLIC_JLPT_COUNTER_COUNTER_TSUU_PATH;
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_COUNTER_TSUU_PATH;
    delete process.env.EXPO_PUBLIC_JLPT_COUNTER_PATH;
    process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH =
      "/reference/jlpt/counters/doc/numbers";
    process.env.EXPO_PUBLIC_JLTP_COUNTER_COUNTER_TSUU_PATH =
      "/reference/jlpt/counters/doc/counter_tsuu";
    (collection as jest.Mock).mockImplementation((_db, path: string) => ({
      path,
    }));
  });

  afterEach(() => {
    __resetCountersServiceForTests();
  });

  it("prefers correctly spelled JLPT env keys when present", () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;
    process.env.EXPO_PUBLIC_JLPT_COUNTER_NUMBERS_PATH =
      "/preferred/jlpt/counters/doc/numbers";

    expect(getCountersCollectionPath("numbers")).toBe(
      "preferred/jlpt/counters/doc/numbers",
    );
  });

  it("keeps supporting legacy JLTP env keys", () => {
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

  it("falls back to the root counters collection when per-tab vars are absent", async () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;
    process.env.EXPO_PUBLIC_JLPT_COUNTER_PATH =
      "/reference/jlpt/counters";

    (getDocs as jest.Mock)
      .mockResolvedValueOnce(
        buildSnapshot([
          {
            id: "root-doc",
            data: () => ({}),
          },
        ]),
      )
      .mockResolvedValueOnce(
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

    const result = await fetchCountersDataFromFirestore("numbers");

    expect(result[0].word).toBe("一");
    expect(collection).toHaveBeenNthCalledWith(1, {}, "reference/jlpt/counters");
    expect(collection).toHaveBeenNthCalledWith(
      2,
      {},
      "reference/jlpt/counters/root-doc/numbers",
    );
  });

  it("throws a descriptive error when no per-tab path or root path exists", async () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;

    await expect(getCountersData("numbers")).rejects.toThrow(
      "Missing or invalid counter collection path for numbers. Checked EXPO_PUBLIC_JLPT_COUNTER_NUMBERS_PATH, EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH, and EXPO_PUBLIC_JLPT_COUNTER_PATH.",
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("throws a descriptive error when the root counters collection is empty", async () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;
    process.env.EXPO_PUBLIC_JLPT_COUNTER_PATH =
      "/reference/jlpt/counters";
    (getDocs as jest.Mock).mockResolvedValue(buildSnapshot([]));

    await expect(fetchCountersDataFromFirestore("numbers")).rejects.toThrow(
      "No counters root document found at EXPO_PUBLIC_JLPT_COUNTER_PATH.",
    );
  });

  it("throws a descriptive error when the root counters collection has multiple docs", async () => {
    delete process.env.EXPO_PUBLIC_JLTP_COUNTER_NUMBERS_PATH;
    process.env.EXPO_PUBLIC_JLPT_COUNTER_PATH =
      "/reference/jlpt/counters";
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot([
        {
          id: "root-a",
          data: () => ({}),
        },
        {
          id: "root-b",
          data: () => ({}),
        },
      ]),
    );

    await expect(fetchCountersDataFromFirestore("numbers")).rejects.toThrow(
      "Expected exactly one counters root document at EXPO_PUBLIC_JLPT_COUNTER_PATH, found 2.",
    );
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
