import { NativeModule, requireOptionalNativeModule } from "expo";

import { KeyboardLanguageModuleEvents } from "./KeyboardLanguage.types";

declare class KeyboardLanguageModule extends NativeModule<KeyboardLanguageModuleEvents> {
  getCurrentInputLanguage(): Promise<string | null>;
  preferInputLanguage(language: string): Promise<string | null>;
}

export default requireOptionalNativeModule<KeyboardLanguageModule>(
  "KeyboardLanguage",
);
