import type { SpeechOptions } from "../services/speechService";

export const DEFAULT_WORD_SPEECH_OPTIONS: SpeechOptions = {
  language: "en-US",
  rate: 0.9,
};

export const parseWordVariants = (value: string): string[] =>
  value
    .split("=")
    .map((segment) => segment.trim())
    .filter(Boolean);

export const speakWordVariants = async (
  value: string,
  speak: (text: string, options?: SpeechOptions) => Promise<void>,
  options: SpeechOptions = DEFAULT_WORD_SPEECH_OPTIONS,
): Promise<void> => {
  const variants = parseWordVariants(value);
  const mergedOptions = { ...DEFAULT_WORD_SPEECH_OPTIONS, ...options };

  if (variants.length <= 1) {
    await speak(variants[0] ?? value.trim(), mergedOptions);
    return;
  }

  const speakVariant = (variant: string) =>
    new Promise<void>((resolve, reject) => {
      speak(variant, {
        ...mergedOptions,
        onDone: resolve,
        onError: reject,
      }).catch(reject);
    });

  for (const variant of variants) {
    await speakVariant(variant);
  }
};
