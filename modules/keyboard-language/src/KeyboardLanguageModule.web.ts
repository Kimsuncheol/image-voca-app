import { NativeModule, registerWebModule } from "expo";

import { KeyboardLanguageModuleEvents } from "./KeyboardLanguage.types";

class KeyboardLanguageModule extends NativeModule<KeyboardLanguageModuleEvents> {
  async getCurrentInputLanguage(): Promise<string | null> {
    return null;
  }

  async preferInputLanguage(_language: string): Promise<string | null> {
    return null;
  }
}

export default registerWebModule(KeyboardLanguageModule, "KeyboardLanguage");
