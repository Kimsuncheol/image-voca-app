import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
});

export interface ExampleGenerationOptions {
  word: string;
  meaning: string;
  courseLevel?: "CSAT" | "TOEFL" | "TOEIC" | "IELTS" | "COLLOCATION" | "OPIC";
  translation?: string; // If provided, generate translation too
}

export interface GeneratedExample {
  example: string;
  translation?: string;
  success: boolean;
  error?: string;
}

/**
 * Generate an example sentence for a vocabulary word using OpenAI GPT-4o-mini
 * The generated sentence will always contain the target word to ensure blanks can be created
 */
export async function generateExampleSentence(
  options: ExampleGenerationOptions
): Promise<GeneratedExample> {
  const { word, meaning, courseLevel = "TOEIC", translation } = options;

  // Define difficulty levels for different courses
  const difficultyMap: Record<string, string> = {
    CSAT: "high school level (Korean university entrance exam)",
    TOEFL: "academic English at university level",
    TOEIC: "business and workplace English",
    IELTS: "academic and general English",
    COLLOCATION: "natural word combinations and phrases",
    OPIC: "everyday conversational English",
  };

  const difficulty = difficultyMap[courseLevel] || "intermediate English";

  const systemPrompt = `You are an expert English language teacher creating example sentences for vocabulary learning.
Your sentences must:
1. Use the exact target word naturally in context
2. Be appropriate for ${difficulty}
3. Be clear and educational
4. Be 10-20 words long
5. NOT use overly complex grammar
6. Show the word's meaning through context`;

  const userPrompt = translation
    ? `Create an example sentence using the word "${word}" (meaning: ${meaning}).
Also provide a Korean translation of the example sentence.

Respond in JSON format:
{
  "example": "your example sentence here",
  "translation": "Korean translation here"
}`
    : `Create an example sentence using the word "${word}" (meaning: ${meaning}).

Respond in JSON format:
{
  "example": "your example sentence here"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model for simple tasks
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Some creativity, but not too wild
      max_tokens: 150,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return {
        success: false,
        example: "",
        error: "No response from OpenAI",
      };
    }

    const parsed = JSON.parse(content);

    // Validate that the example contains the target word
    const exampleLower = parsed.example.toLowerCase();
    const wordLower = word.toLowerCase();

    if (!exampleLower.includes(wordLower)) {
      console.warn(
        `[ExampleGen] Generated example doesn't contain word "${word}":`,
        parsed.example
      );
      // Retry once with stricter prompt
      return generateExampleSentenceStrict(options);
    }

    return {
      success: true,
      example: parsed.example,
      translation: parsed.translation,
    };
  } catch (error: any) {
    console.error("[ExampleGen] Error generating example:", error);
    return {
      success: false,
      example: "",
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Stricter version that explicitly requires the word to be included
 * Used as fallback when first attempt doesn't include the target word
 */
async function generateExampleSentenceStrict(
  options: ExampleGenerationOptions
): Promise<GeneratedExample> {
  const { word, meaning, courseLevel = "TOEIC", translation } = options;

  const userPrompt = translation
    ? `Create an example sentence that MUST include the exact word "${word}" (meaning: ${meaning}).
CRITICAL: The word "${word}" MUST appear in your example sentence.
Also provide a Korean translation.

Respond in JSON format:
{
  "example": "your example sentence with ${word} included",
  "translation": "Korean translation"
}`
    : `Create an example sentence that MUST include the exact word "${word}" (meaning: ${meaning}).
CRITICAL: The word "${word}" MUST appear in your example sentence.

Respond in JSON format:
{
  "example": "your example sentence with ${word} included"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an English teacher. Create example sentences that include the target word.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5, // Less creative for stricter requirements
      max_tokens: 150,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return {
        success: false,
        example: "",
        error: "No response from OpenAI (strict mode)",
      };
    }

    const parsed = JSON.parse(content);

    return {
      success: true,
      example: parsed.example,
      translation: parsed.translation,
    };
  } catch (error: any) {
    console.error("[ExampleGen] Error in strict mode:", error);
    return {
      success: false,
      example: "",
      error: error.message || "Unknown error (strict mode)",
    };
  }
}

/**
 * Batch generate example sentences for multiple words
 * Includes delay to avoid rate limiting
 */
export async function batchGenerateExamples(
  items: ExampleGenerationOptions[],
  onProgress?: (current: number, total: number, word: string) => void
): Promise<GeneratedExample[]> {
  const results: GeneratedExample[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i + 1, items.length, item.word);

    const result = await generateExampleSentence(item);
    results.push(result);

    // Add small delay to avoid rate limiting (adjust as needed)
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
    }
  }

  return results;
}

/**
 * Check if an example sentence is valid (contains the target word)
 */
export function isExampleValid(example: string, word: string): boolean {
  if (!example || !word) return false;

  const exampleLower = example.toLowerCase();
  const wordLower = word.toLowerCase();

  // Check if word appears as whole word (not part of another word)
  const wordRegex = new RegExp(`\\b${wordLower}\\w*\\b`, "i");
  return wordRegex.test(exampleLower);
}
