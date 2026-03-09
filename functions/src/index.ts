import { createHash } from "node:crypto";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const qwenApiKey = defineSecret("QWEN_TTS_API_KEY");

interface QwenTtsRequestBody {
  text?: string;
  language?: string;
  rate?: number;
  voice?: string;
}

interface VoiceDefinition {
  alias: string;
  providerVoice: string;
}

const VOICE_MAP: Record<string, VoiceDefinition> = {
  Aiden: {
    alias: "Aiden",
    providerVoice: "Aiden",
  },
  Sohee: {
    alias: "Sohee",
    providerVoice: "Sohee",
  },
  Ono_Anna: {
    alias: "Ono_Anna",
    providerVoice: "Ono Anna",
  },
};

const DEFAULT_VOICE_BY_LANGUAGE: Record<string, string> = {
  en: "Aiden",
  ja: "Ono_Anna",
  ko: "Sohee",
};

const stripSurroundingQuotes = (text: string): string => {
  const trimmedText = text.trim();
  if (
    (trimmedText.startsWith('"') && trimmedText.endsWith('"')) ||
    (trimmedText.startsWith("'") && trimmedText.endsWith("'"))
  ) {
    return trimmedText.slice(1, -1).trim();
  }
  return trimmedText;
};

const normalizeText = (text: string): string =>
  stripSurroundingQuotes(text).replace(/\s+/g, " ").trim();

const clampRate = (rate?: number): number => {
  if (typeof rate !== "number" || Number.isNaN(rate)) {
    return 0.9;
  }

  return Math.min(2, Math.max(0.5, rate));
};

const getBaseLanguageCode = (language = "en-US"): string =>
  language.split("-")[0].toLowerCase();

const resolveVoiceAlias = (language?: string, voice?: string): string => {
  if (voice && VOICE_MAP[voice]) {
    return voice;
  }

  const baseCode = getBaseLanguageCode(language);
  return DEFAULT_VOICE_BY_LANGUAGE[baseCode] || "Aiden";
};

const buildCacheKey = (
  text: string,
  language: string,
  voice: string,
  rate: number
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        text,
        language,
        voice,
        rate,
      })
    )
    .digest("hex");

const parseBody = (body: unknown): QwenTtsRequestBody => {
  if (typeof body === "string") {
    return JSON.parse(body) as QwenTtsRequestBody;
  }

  if (body && typeof body === "object") {
    return body as QwenTtsRequestBody;
  }

  return {};
};

export const qwenTtsSynthesize = onRequest(
  {
    cors: true,
    region: "asia-northeast3",
    secrets: [qwenApiKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ message: "Method not allowed." });
      return;
    }

    try {
      const body = parseBody(req.body);
      const normalizedText = normalizeText(body.text || "");

      if (!normalizedText) {
        res.status(400).json({ message: "Text is required." });
        return;
      }

      if (normalizedText.length > 300) {
        res
          .status(400)
          .json({ message: "Text must be 300 characters or fewer." });
        return;
      }

      const language = (body.language || "en-US").trim() || "en-US";
      const rate = clampRate(body.rate);
      const voiceAlias = resolveVoiceAlias(language, body.voice);
      const voiceConfig = VOICE_MAP[voiceAlias];

      if (!voiceConfig) {
        res.status(400).json({ message: "Unsupported voice." });
        return;
      }

      const cacheKey = buildCacheKey(
        normalizedText,
        language,
        voiceConfig.alias,
        rate
      );

      const response = await fetch(
        "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qwenApiKey.value()}`,
            "Content-Type": "application/json",
            "X-DashScope-Async": "disable",
          },
          body: JSON.stringify({
            model: "qwen-tts",
            input: {
              text: normalizedText,
              voice: voiceConfig.providerVoice,
            },
            parameters: {
              format: "mp3",
            },
          }),
        }
      );

      const payload = (await response.json()) as {
        message?: string;
        output?: {
          audio?: {
            url?: string;
          };
        };
      };

      if (!response.ok) {
        res.status(response.status).json({
          message: payload.message || "Qwen TTS request failed.",
        });
        return;
      }

      const audioUrl = payload.output?.audio?.url;
      if (!audioUrl) {
        res.status(502).json({ message: "Qwen TTS returned no audio URL." });
        return;
      }

      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        res.status(502).json({ message: "Failed to download synthesized audio." });
        return;
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      res.status(200).json({
        audioBase64: audioBuffer.toString("base64"),
        mimeType: "audio/mpeg",
        cacheKey,
      });
    } catch (error) {
      console.error("Qwen TTS synthesis failed:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Unexpected Qwen TTS synthesis error.",
      });
    }
  }
);
