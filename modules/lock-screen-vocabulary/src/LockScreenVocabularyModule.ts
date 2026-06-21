import type { NativeModule } from "expo";

import { LockScreenVocabularyModuleEvents } from "./LockScreenVocabulary.types";

declare class LockScreenVocabularyModule extends NativeModule<LockScreenVocabularyModuleEvents> {
  setPayload(
    appGroupIdentifier: string,
    storageKey: string,
    payloadJson: string | null,
  ): Promise<void>;
}

let nativeModule: LockScreenVocabularyModule | null | undefined;

const loadNativeModule = (): LockScreenVocabularyModule | null => {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  if (process.env.NODE_ENV === "test") {
    nativeModule = null;
    return nativeModule;
  }

  try {
    const { requireOptionalNativeModule } = require("expo") as typeof import("expo");
    nativeModule = requireOptionalNativeModule<LockScreenVocabularyModule>(
      "LockScreenVocabulary",
    );
  } catch {
    nativeModule = null;
  }

  return nativeModule;
};

export default {
  async setPayload(
    appGroupIdentifier: string,
    storageKey: string,
    payloadJson: string | null,
  ) {
    const module = loadNativeModule();
    if (!module) return;

    await module.setPayload(appGroupIdentifier, storageKey, payloadJson);
  },
};
