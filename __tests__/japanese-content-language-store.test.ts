import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  __resetJapaneseContentLanguageStoreForTests,
  JAPANESE_CONTENT_LANGUAGE_STORAGE_KEY,
  useJapaneseContentLanguageStore,
} from "../src/stores/japaneseContentLanguageStore";

describe("japaneseContentLanguageStore", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetJapaneseContentLanguageStoreForTests();
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
