export type KeyboardLanguageCode = "en" | "ja" | string;

type KeyboardLanguageNativeModule = {
  getCurrentInputLanguage: () => Promise<string | null>;
  preferInputLanguage: (language: string) => Promise<string | null>;
};

const loadKeyboardLanguageModule =
  async (): Promise<KeyboardLanguageNativeModule | null> => {
    try {
      // Lazy-load so test environments that only import quiz components do not
      // initialize ExpoModulesCore unless the keyboard guard actually runs.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("@/modules/keyboard-language") as {
        default: KeyboardLanguageNativeModule | null;
      };
      return module.default;
    } catch {
      return null;
    }
  };

const normalizeLanguageBase = (language?: string | null) =>
  language?.trim().toLowerCase().replace("_", "-").split("-")[0] ?? null;

export const doesKeyboardLanguageMatch = (
  currentLanguage: string | null | undefined,
  targetLanguage: KeyboardLanguageCode,
) => {
  const currentBase = normalizeLanguageBase(currentLanguage);
  const targetBase = normalizeLanguageBase(targetLanguage);
  return Boolean(currentBase && targetBase && currentBase === targetBase);
};

export const getCurrentKeyboardLanguage = async (): Promise<string | null> => {
  try {
    const module = await loadKeyboardLanguageModule();
    return (await module?.getCurrentInputLanguage()) ?? null;
  } catch {
    return null;
  }
};

export const preferKeyboardLanguage = async (
  targetLanguage: KeyboardLanguageCode,
): Promise<string | null> => {
  try {
    const module = await loadKeyboardLanguageModule();
    return (
      (await module?.preferInputLanguage(targetLanguage)) ?? null
    );
  } catch {
    return null;
  }
};
