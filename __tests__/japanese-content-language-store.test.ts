import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  __resetJapaneseContentLanguageStoreForTests,
  JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD,
  JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
  useJapaneseContentLanguageStore,
} from "../src/stores/japaneseContentLanguageStore";

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn(
  async (_ref: unknown, _data: unknown, _options: unknown) => undefined,
);

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, collection: string, id: string) => `${collection}/${id}`),
  getDoc: (ref: unknown) => mockGetDoc(ref),
  setDoc: (ref: unknown, data: unknown, options: unknown) =>
    mockSetDoc(ref, data, options),
}));

jest.mock("../src/services/firebase", () => ({
  db: {},
}));

describe("japaneseContentLanguageStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    __resetJapaneseContentLanguageStoreForTests();
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
  });

  it("hydrates defaults", async () => {
    await expect(
      useJapaneseContentLanguageStore.getState().hydrate(),
    ).resolves.toEqual({ mode: "default" });

    expect(useJapaneseContentLanguageStore.getState()).toEqual(
      expect.objectContaining({
        mode: "default",
        _initialized: true,
      }),
    );
  });

  it("persists Korean content mode", async () => {
    await useJapaneseContentLanguageStore.getState().setMode("ko");

    expect(useJapaneseContentLanguageStore.getState().mode).toBe("ko");
    await expect(
      AsyncStorage.getItem(JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY),
    ).resolves.toBe(JSON.stringify({ mode: "ko" }));
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("persists Korean content mode remotely for signed-in users", async () => {
    await useJapaneseContentLanguageStore.getState().setMode("ko", "user-1");

    expect(useJapaneseContentLanguageStore.getState()).toEqual(
      expect.objectContaining({
        mode: "ko",
        _initialized: true,
        _hydratedUserId: "user-1",
      }),
    );
    await expect(
      AsyncStorage.getItem(JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY),
    ).resolves.toBe(JSON.stringify({ mode: "ko" }));
    expect(mockSetDoc).toHaveBeenCalledWith(
      "users/user-1",
      { [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "ko" },
      { merge: true },
    );
  });

  it("persists default content mode remotely when toggled off", async () => {
    await useJapaneseContentLanguageStore.getState().setMode("ko", "user-1");
    await useJapaneseContentLanguageStore
      .getState()
      .setMode("default", "user-1");

    expect(useJapaneseContentLanguageStore.getState().mode).toBe("default");
    await expect(
      AsyncStorage.getItem(JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY),
    ).resolves.toBe(JSON.stringify({ mode: "default" }));
    expect(mockSetDoc).toHaveBeenLastCalledWith(
      "users/user-1",
      { [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "default" },
      { merge: true },
    );
  });

  it("hydrates remote content mode for signed-in users", async () => {
    await AsyncStorage.setItem(
      JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
      JSON.stringify({ mode: "default" }),
    );
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "ko",
      }),
    });

    await expect(
      useJapaneseContentLanguageStore.getState().hydrate("user-1"),
    ).resolves.toEqual({ mode: "ko" });

    expect(useJapaneseContentLanguageStore.getState()).toEqual(
      expect.objectContaining({
        mode: "ko",
        _initialized: true,
        _hydratedUserId: "user-1",
      }),
    );
    await expect(
      AsyncStorage.getItem(JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY),
    ).resolves.toBe(JSON.stringify({ mode: "ko" }));
  });

  it("falls back to local content mode when remote content mode is missing or invalid", async () => {
    await AsyncStorage.setItem(
      JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
      JSON.stringify({ mode: "ko" }),
    );
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        [JAPANESE_CONTENT_LANGUAGE_FIRESTORE_FIELD]: "ja",
      }),
    });

    await expect(
      useJapaneseContentLanguageStore.getState().hydrate("user-1"),
    ).resolves.toEqual({ mode: "ko" });

    expect(useJapaneseContentLanguageStore.getState().mode).toBe("ko");
  });

  it("falls back to default for invalid stored data", async () => {
    await AsyncStorage.setItem(
      JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
      JSON.stringify({ mode: "ja" }),
    );

    await expect(
      useJapaneseContentLanguageStore.getState().hydrate(),
    ).resolves.toEqual({ mode: "default" });
  });
});
