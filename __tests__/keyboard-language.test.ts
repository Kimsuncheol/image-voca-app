const mockGetCurrentInputLanguage = jest.fn();
const mockPreferInputLanguage = jest.fn();
let mockKeyboardLanguageModule: {
  getCurrentInputLanguage: (...args: unknown[]) => unknown;
  preferInputLanguage: (...args: unknown[]) => unknown;
} | null = {
  getCurrentInputLanguage: (...args: unknown[]) =>
    mockGetCurrentInputLanguage(...args),
  preferInputLanguage: (...args: unknown[]) => mockPreferInputLanguage(...args),
};

jest.mock("@/modules/keyboard-language", () => ({
  __esModule: true,
  get default() {
    return mockKeyboardLanguageModule;
  },
}));

import {
  doesKeyboardLanguageMatch,
  getCurrentKeyboardLanguage,
  preferKeyboardLanguage,
} from "../src/native/keyboardLanguage";

describe("keyboardLanguage native wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeyboardLanguageModule = {
      getCurrentInputLanguage: (...args: unknown[]) =>
        mockGetCurrentInputLanguage(...args),
      preferInputLanguage: (...args: unknown[]) =>
        mockPreferInputLanguage(...args),
    };
  });

  it("normalizes language tags for matching", () => {
    expect(doesKeyboardLanguageMatch("ja-JP", "ja")).toBe(true);
    expect(doesKeyboardLanguageMatch("en_US", "en")).toBe(true);
    expect(doesKeyboardLanguageMatch("ko-KR", "ja")).toBe(false);
  });

  it("returns the current native keyboard language", async () => {
    mockGetCurrentInputLanguage.mockResolvedValue("ja-JP");

    await expect(getCurrentKeyboardLanguage()).resolves.toBe("ja-JP");
  });

  it("returns null when native language inspection is unavailable", async () => {
    mockKeyboardLanguageModule = null;

    await expect(getCurrentKeyboardLanguage()).resolves.toBeNull();
    await expect(preferKeyboardLanguage("ja")).resolves.toBeNull();
  });

  it("passes the preferred target language to native code", async () => {
    mockPreferInputLanguage.mockResolvedValue("en-US");

    await expect(preferKeyboardLanguage("en")).resolves.toBe("en-US");
    expect(mockPreferInputLanguage).toHaveBeenCalledWith("en");
  });
});
