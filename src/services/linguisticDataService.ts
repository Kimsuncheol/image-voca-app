import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
});

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "other";

export interface WordForms {
  base: string;
  nounForm?: string;
  verbForm?: string;
  adjectiveForm?: string;
  adverbForm?: string;
  gerundForm?: string;
  pastForm?: string;
  pluralForm?: string;
}

export interface LinguisticDataOptions {
  word: string;
  meaning: string;
  courseLevel?: "CSAT" | "TOEFL" | "TOEIC" | "IELTS" | "COLLOCATION" | "OPIC";
}

export interface GeneratedLinguisticData {
  partOfSpeech: PartOfSpeech;
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  wordForms: WordForms;
  success: boolean;
  error?: string;
}

/**
 * Generate linguistic data (synonyms, antonyms, related words, word forms)
 * for a vocabulary word using OpenAI GPT-4o-mini
 */
export async function generateLinguisticData(
  options: LinguisticDataOptions
): Promise<GeneratedLinguisticData> {
  const { word, meaning, courseLevel = "TOEIC" } = options;

  const difficultyMap: Record<string, string> = {
    CSAT: "high school level (Korean university entrance exam)",
    TOEFL: "academic English at university level",
    TOEIC: "business and workplace English",
    IELTS: "academic and general English",
    COLLOCATION: "natural word combinations and phrases",
    OPIC: "everyday conversational English",
  };

  const difficulty = difficultyMap[courseLevel] || "intermediate English";

  const systemPrompt = `You are an expert English linguist and vocabulary educator.
Your task is to generate comprehensive linguistic data for vocabulary learning.
Consider the target audience level: ${difficulty}

Rules:
1. Accurately detect the part of speech of the word based on the meaning provided
2. Provide 3-5 high-quality synonyms appropriate for the course level
3. Provide 0-3 antonyms ONLY if they naturally exist (some words don't have antonyms - return empty array)
4. Provide 3-5 contextually related words (not just synonyms, but words often used together or in similar contexts)
5. Generate word forms based on the detected part of speech:
   - For verbs: include nounForm, adjectiveForm, adverbForm, gerundForm, pastForm
   - For nouns: include verbForm, adjectiveForm, adverbForm, pluralForm
   - For adjectives: include nounForm, verbForm, adverbForm
   - For adverbs: include nounForm, verbForm, adjectiveForm
6. If a word form doesn't exist naturally in English, omit that field
7. All words should be appropriate for ${difficulty} learners`;

  const userPrompt = `Analyze the word "${word}" (meaning: ${meaning}).

Generate linguistic data in JSON format:
{
  "partOfSpeech": "noun|verb|adjective|adverb|other",
  "synonyms": ["word1", "word2", "word3"],
  "antonyms": ["word1"] or [],
  "relatedWords": ["word1", "word2", "word3"],
  "wordForms": {
    "base": "${word}",
    "nounForm": "if applicable",
    "verbForm": "if applicable",
    "adjectiveForm": "if applicable",
    "adverbForm": "if applicable",
    "gerundForm": "if verb",
    "pastForm": "if verb",
    "pluralForm": "if noun"
  }
}

Important: Only include word form fields that actually exist for this word.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return createErrorResponse("No response from OpenAI");
    }

    const parsed = JSON.parse(content);

    // Validate response structure
    if (!isLinguisticDataValid(parsed)) {
      console.warn(
        `[LinguisticData] Invalid response structure for "${word}":`,
        parsed
      );
      return generateLinguisticDataStrict(options);
    }

    return {
      partOfSpeech: parsed.partOfSpeech || "other",
      synonyms: parsed.synonyms || [],
      antonyms: parsed.antonyms || [],
      relatedWords: parsed.relatedWords || [],
      wordForms: {
        base: word,
        ...parsed.wordForms,
      },
      success: true,
    };
  } catch (error: any) {
    console.error("[LinguisticData] Error generating data:", error);
    return createErrorResponse(error.message || "Unknown error");
  }
}

/**
 * Stricter version with more explicit instructions
 * Used as fallback when first attempt fails validation
 */
async function generateLinguisticDataStrict(
  options: LinguisticDataOptions
): Promise<GeneratedLinguisticData> {
  const { word, meaning, courseLevel = "TOEIC" } = options;

  const userPrompt = `For the English word "${word}" (meaning: ${meaning}), provide:

1. partOfSpeech: What part of speech is this word? (noun, verb, adjective, adverb, or other)
2. synonyms: List 3-5 words with similar meanings
3. antonyms: List 0-3 words with opposite meanings (empty array [] if none exist)
4. relatedWords: List 3-5 words commonly associated with this word
5. wordForms: Different grammatical forms of this word

IMPORTANT: Return valid JSON only. Example format:
{
  "partOfSpeech": "verb",
  "synonyms": ["determine", "choose", "resolve"],
  "antonyms": ["hesitate"],
  "relatedWords": ["decision", "choice", "option"],
  "wordForms": {
    "base": "${word}",
    "nounForm": "decision",
    "adjectiveForm": "decisive",
    "adverbForm": "decisively",
    "gerundForm": "deciding",
    "pastForm": "decided"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an English linguist. Provide linguistic data in valid JSON format.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return createErrorResponse("No response from OpenAI (strict mode)");
    }

    const parsed = JSON.parse(content);

    return {
      partOfSpeech: parsed.partOfSpeech || "other",
      synonyms: parsed.synonyms || [],
      antonyms: parsed.antonyms || [],
      relatedWords: parsed.relatedWords || [],
      wordForms: {
        base: word,
        ...parsed.wordForms,
      },
      success: true,
    };
  } catch (error: any) {
    console.error("[LinguisticData] Error in strict mode:", error);
    return createErrorResponse(error.message || "Unknown error (strict mode)");
  }
}

/**
 * Validate that the linguistic data response has required fields
 */
export function isLinguisticDataValid(data: any): boolean {
  if (!data || typeof data !== "object") return false;

  // Check required fields exist and are arrays
  if (!Array.isArray(data.synonyms)) return false;
  if (!Array.isArray(data.antonyms)) return false;
  if (!Array.isArray(data.relatedWords)) return false;

  // Check partOfSpeech is valid
  const validPOS = ["noun", "verb", "adjective", "adverb", "other"];
  if (!validPOS.includes(data.partOfSpeech)) return false;

  // Check wordForms exists
  if (!data.wordForms || typeof data.wordForms !== "object") return false;

  return true;
}

/**
 * Helper to create error response
 */
function createErrorResponse(error: string): GeneratedLinguisticData {
  return {
    partOfSpeech: "other",
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    wordForms: { base: "" },
    success: false,
    error,
  };
}

/**
 * Batch generate linguistic data for multiple words
 * Includes delay to avoid rate limiting
 */
export async function batchGenerateLinguisticData(
  items: LinguisticDataOptions[],
  onProgress?: (current: number, total: number, word: string) => void
): Promise<GeneratedLinguisticData[]> {
  const results: GeneratedLinguisticData[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i + 1, items.length, item.word);

    const result = await generateLinguisticData(item);
    results.push(result);

    // Add delay to avoid rate limiting
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
