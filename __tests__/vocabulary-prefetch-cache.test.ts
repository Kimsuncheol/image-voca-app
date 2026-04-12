import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, limit, query } from "firebase/firestore";
import {
  __resetVocabularyPrefetchStateForTests,
  getCachedVocabularyCards,
  prefetchVocabularyCards,
} from "../src/services/vocabularyPrefetch";

const mockSetFirebaseOnline = jest.fn();
const mockSetFirebaseOffline = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn((value: number) => ({ type: "limit", value })),
  query: jest.fn((target: unknown, ...constraints: unknown[]) => ({
    target,
    constraints,
  })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../src/stores/networkStore", () => ({
  useNetworkStore: {
    getState: () => ({
      setFirebaseOnline: mockSetFirebaseOnline,
      setFirebaseOffline: mockSetFirebaseOffline,
    }),
  },
}));

type MockDoc = {
  id: string;
  data: () => Record<string, unknown>;
};

const buildSnapshot = (docs: MockDoc[]) => ({
  docs,
  empty: docs.length === 0,
});

const buildDoc = (
  id: string,
  word: string,
  meaning = "meaning",
): MockDoc => ({
  id,
  data: () => ({
    word,
    meaning,
    example: `${word} example`,
  }),
});

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("vocabulary prefetch caching", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    __resetVocabularyPrefetchStateForTests();
    await AsyncStorage.clear();
    (collection as jest.Mock).mockImplementation(
      (_db, path: string, subCollectionName: string) => ({
        path,
        subCollectionName,
      }),
    );
    (query as jest.Mock).mockImplementation(
      (target: unknown, ...constraints: unknown[]) => ({
        target,
        constraints,
      }),
    );
    (getDocs as jest.Mock).mockResolvedValue(
      buildSnapshot([buildDoc("fresh-1", "fresh-word")]),
    );
  });

  it("returns fresh cached cards without a Firestore read", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v5:TOEIC-Day1",
      JSON.stringify({
        updatedAt: Date.now(),
        cards: [
          {
            id: "cached-1",
            word: "cached-word",
            meaning: "cached meaning",
            example: "cached example",
            course: "TOEIC",
          },
        ],
      }),
    );

    const cards = await prefetchVocabularyCards("TOEIC", 1);

    expect(cards).toHaveLength(1);
    expect(cards[0].word).toBe("cached-word");
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("returns stale cached cards immediately and revalidates in the background", async () => {
    await AsyncStorage.setItem(
      "vocab_cache_v5:TOEIC-Day1",
      JSON.stringify({
        updatedAt: Date.now() - 1000 * 60 * 60 * 7,
        cards: [
          {
            id: "stale-1",
            word: "stale-word",
            meaning: "stale meaning",
            example: "stale example",
            course: "TOEIC",
          },
        ],
      }),
    );

    const cards = await prefetchVocabularyCards("TOEIC", 1);

    expect(cards[0].word).toBe("stale-word");
    expect(getDocs).toHaveBeenCalledTimes(1);

    await Promise.resolve();

    const refreshed = getCachedVocabularyCards("TOEIC", 1);
    expect(refreshed?.[0].word).toBe("fresh-word");
    expect(mockSetFirebaseOnline).toHaveBeenCalled();
  });

  it("fetches from Firestore when there is no cache", async () => {
    const cards = await prefetchVocabularyCards("TOEIC", 1);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(cards[0].word).toBe("fresh-word");
    expect(limit).not.toHaveBeenCalled();
  });

  it("dedupes concurrent callers for the same course day", async () => {
    const deferred = createDeferred<ReturnType<typeof buildSnapshot>>();
    (getDocs as jest.Mock).mockReturnValue(deferred.promise);

    const firstRequest = prefetchVocabularyCards("TOEIC", 1, {
      preferCache: false,
    });
    const secondRequest = prefetchVocabularyCards("TOEIC", 1, {
      preferCache: false,
    });

    expect(getDocs).toHaveBeenCalledTimes(1);

    deferred.resolve(buildSnapshot([buildDoc("shared-1", "shared-word")]));

    await expect(firstRequest).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ word: "shared-word" })]),
    );
    await expect(secondRequest).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ word: "shared-word" })]),
    );
    expect(getDocs).toHaveBeenCalledTimes(1);
  });
});
