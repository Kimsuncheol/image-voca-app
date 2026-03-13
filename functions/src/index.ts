import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const qwenApiKey = defineSecret("QWEN_TTS_API_KEY");
const tossSecretKey = defineSecret("TOSS_SECRET_KEY");

if (!getApps().length) {
  initializeApp();
}

type BillingStorefront = "KR" | "US";
type BillingCurrency = "KRW" | "USD";
type SupportedPlanId = "voca_unlimited";

interface ConfirmTossPaymentRequestBody {
  planId?: string;
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  country?: string;
}

interface ConfirmedTossPayment {
  paymentKey?: string;
  orderId?: string;
  totalAmount?: number;
  balanceAmount?: number;
  currency?: string;
  country?: string;
  method?: string;
  approvedAt?: string;
}

const STORE_FRONT_PRICES: Record<
  BillingStorefront,
  {
    amount: number;
    currency: BillingCurrency;
    country: BillingStorefront;
  }
> = {
  KR: {
    amount: 12_000,
    currency: "KRW",
    country: "KR",
  },
  US: {
    amount: 9.99,
    currency: "USD",
    country: "US",
  },
};

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

const parseConfirmPaymentBody = (body: unknown): ConfirmTossPaymentRequestBody => {
  if (typeof body === "string") {
    return JSON.parse(body) as ConfirmTossPaymentRequestBody;
  }

  if (body && typeof body === "object") {
    return body as ConfirmTossPaymentRequestBody;
  }

  return {};
};

const readBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

const isSupportedPlanId = (planId: string | undefined): planId is SupportedPlanId =>
  planId === "voca_unlimited";

const resolveStorefront = (country?: string | null): BillingStorefront =>
  country?.toUpperCase() === "KR" ? "KR" : "US";

const amountsMatch = (left: number, right: number) =>
  Math.abs(left - right) < 0.0001;

const getConfirmedAmount = (payload: ConfirmedTossPayment) =>
  typeof payload.totalAmount === "number"
    ? payload.totalAmount
    : payload.balanceAmount;

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

export const confirmTossPayment = onRequest(
  {
    cors: true,
    region: "asia-northeast3",
    secrets: [tossSecretKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ message: "Method not allowed." });
      return;
    }

    try {
      const bearerToken = readBearerToken(req.header("Authorization"));
      if (!bearerToken) {
        res.status(401).json({ message: "Authentication is required." });
        return;
      }

      const decodedToken = await getAuth().verifyIdToken(bearerToken);
      const body = parseConfirmPaymentBody(req.body);

      if (!isSupportedPlanId(body.planId)) {
        res.status(400).json({ message: "Unsupported plan." });
        return;
      }

      if (!body.paymentKey || !body.orderId || typeof body.amount !== "number") {
        res.status(400).json({ message: "Missing required payment fields." });
        return;
      }

      const storefront = resolveStorefront(body.country);
      const expectedPrice = STORE_FRONT_PRICES[storefront];
      const requestedCurrency = body.currency?.toUpperCase() as
        | BillingCurrency
        | undefined;
      const requestedCountry = body.country?.toUpperCase() as
        | BillingStorefront
        | undefined;

      if (
        !amountsMatch(body.amount, expectedPrice.amount) ||
        requestedCurrency !== expectedPrice.currency ||
        requestedCountry !== expectedPrice.country
      ) {
        res.status(400).json({ message: "Payment details do not match plan pricing." });
        return;
      }

      const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey.value()}:`).toString("base64")}`,
          "Content-Type": "application/json",
          "Accept-Language": "en",
        },
        body: JSON.stringify({
          paymentKey: body.paymentKey,
          orderId: body.orderId,
          amount: body.amount,
        }),
      });

      const tossPayload = (await tossResponse.json()) as
        | ConfirmedTossPayment
        | { message?: string };

      if (!tossResponse.ok) {
        res.status(tossResponse.status).json({
          message:
            "message" in tossPayload && tossPayload.message
              ? tossPayload.message
              : "Toss payment confirmation failed.",
        });
        return;
      }

      const confirmedPayment = tossPayload as ConfirmedTossPayment;
      const confirmedAmount = getConfirmedAmount(confirmedPayment);
      const confirmedCurrency = confirmedPayment.currency?.toUpperCase() as
        | BillingCurrency
        | undefined;
      const confirmedCountry = confirmedPayment.country?.toUpperCase() as
        | BillingStorefront
        | undefined;

      if (
        confirmedPayment.paymentKey !== body.paymentKey ||
        confirmedPayment.orderId !== body.orderId ||
        typeof confirmedAmount !== "number" ||
        !amountsMatch(confirmedAmount, expectedPrice.amount) ||
        confirmedCurrency !== expectedPrice.currency ||
        (confirmedCountry && confirmedCountry !== expectedPrice.country)
      ) {
        res.status(400).json({ message: "Confirmed payment does not match the requested order." });
        return;
      }

      const paidAt = confirmedPayment.approvedAt || new Date().toISOString();
      const subscription = {
        planId: body.planId,
        orderId: body.orderId,
        provider: "toss_payments" as const,
        paymentKey: body.paymentKey,
        amount: expectedPrice.amount,
        currency: expectedPrice.currency,
        country: expectedPrice.country,
        paidAt,
        updatedAt: paidAt,
      };

      const db = getFirestore();
      const userRef = db.collection("users").doc(decodedToken.uid);
      const paymentRef = userRef.collection("payments").doc(body.orderId);
      const batch = db.batch();

      batch.set(
        userRef,
        {
          subscription,
        },
        { merge: true },
      );
      batch.set(
        paymentRef,
        {
          ...subscription,
          planId: body.planId,
          method: confirmedPayment.method ?? null,
          userId: decodedToken.uid,
        },
        { merge: true },
      );
      await batch.commit();

      res.status(200).json({ subscription });
    } catch (error) {
      console.error("Toss payment confirmation failed:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Unexpected Toss payment confirmation error.",
      });
    }
  },
);
