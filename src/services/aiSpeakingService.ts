import * as FileSystem from "expo-file-system";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
});

// Types for speaking practice
export type ExamType = "toeic" | "opic";

export interface SpeakingFeedback {
  overallScore: number;
  pronunciation: number;
  fluency: number;
  grammar: number;
  vocabulary: number;
  content: number;
  transcription: string;
  suggestions: string[];
  strengths: string[];
  predictedLevel?: string; // For OPIc: IL, IM1, IM2, IM3, IH, AL
}

export interface TOEICPart {
  part: number;
  title: string;
  description: string;
  prepTime: number; // seconds
  responseTime: number; // seconds
}

export const TOEIC_SPEAKING_PARTS: TOEICPart[] = [
  {
    part: 1,
    title: "Read Aloud",
    description: "Read a text aloud with clear pronunciation",
    prepTime: 45,
    responseTime: 45,
  },
  {
    part: 2,
    title: "Read Aloud",
    description: "Read a text aloud with clear pronunciation",
    prepTime: 45,
    responseTime: 45,
  },
  {
    part: 3,
    title: "Describe a Picture",
    description: "Describe the picture in as much detail as possible",
    prepTime: 45,
    responseTime: 30,
  },
  {
    part: 4,
    title: "Respond to Questions",
    description: "Answer questions about everyday topics",
    prepTime: 0,
    responseTime: 15,
  },
  {
    part: 5,
    title: "Propose a Solution",
    description: "Listen to a problem and propose a solution",
    prepTime: 30,
    responseTime: 60,
  },
  {
    part: 6,
    title: "Express an Opinion",
    description: "Express your opinion on a given topic",
    prepTime: 30,
    responseTime: 60,
  },
];

export type OPIcLevel = "IL" | "IM1" | "IM2" | "IM3" | "IH" | "AL";

export interface OPIcTopic {
  id: string;
  title: string;
  titleKey: string;
  questions: string[];
}

export const OPIC_TOPICS: OPIcTopic[] = [
  {
    id: "self-intro",
    title: "Self Introduction",
    titleKey: "speaking.opic.topics.selfIntro",
    questions: [
      "Tell me about yourself.",
      "What do you do for a living?",
      "Describe your daily routine.",
    ],
  },
  {
    id: "hobbies",
    title: "Hobbies & Interests",
    titleKey: "speaking.opic.topics.hobbies",
    questions: [
      "What are your hobbies?",
      "How did you become interested in this hobby?",
      "Tell me about a memorable experience related to your hobby.",
    ],
  },
  {
    id: "travel",
    title: "Travel",
    titleKey: "speaking.opic.topics.travel",
    questions: [
      "Describe your favorite travel destination.",
      "Tell me about a memorable trip you took.",
      "What do you like to do when you travel?",
    ],
  },
  {
    id: "technology",
    title: "Technology",
    titleKey: "speaking.opic.topics.technology",
    questions: [
      "How do you use technology in your daily life?",
      "Describe a gadget you use frequently.",
      "How has technology changed your life?",
    ],
  },
  {
    id: "food",
    title: "Food & Cooking",
    titleKey: "speaking.opic.topics.food",
    questions: [
      "What's your favorite food?",
      "Tell me about a restaurant you like.",
      "Can you describe how to make your favorite dish?",
    ],
  },
];

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    // Read the audio file
    const audioInfo = await FileSystem.getInfoAsync(audioUri);
    if (!audioInfo.exists) {
      throw new Error("Audio file not found");
    }

    // Convert to base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create a blob-like object for the API
    const response = await openai.audio.transcriptions.create({
      file: await fetch(`data:audio/m4a;base64,${base64Audio}`).then((r) =>
        r.blob()
      ),
      model: "whisper-1",
      language: "en",
    });

    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * Analyze speaking response using GPT-4
 */
export async function analyzeSpeakingResponse(
  transcription: string,
  examType: ExamType,
  questionPrompt: string,
  partInfo?: TOEICPart
): Promise<SpeakingFeedback> {
  const systemPrompt =
    examType === "toeic"
      ? `You are an expert TOEIC Speaking examiner. Analyze the following response and provide detailed feedback.
         Consider pronunciation, fluency, grammar, vocabulary, and content accuracy.
         Score each category from 0-5, and provide an overall score from 0-200.
         ${partInfo ? `This is Part ${partInfo.part}: ${partInfo.title} - ${partInfo.description}` : ""}`
      : `You are an expert OPIc examiner. Analyze the following response and provide detailed feedback.
         Consider pronunciation, fluency, grammar, vocabulary, and content.
         Score each category from 0-5, and predict the OPIc level (IL, IM1, IM2, IM3, IH, AL).`;

  const userPrompt = `Question: ${questionPrompt}

Response transcript: ${transcription}

Please analyze this response and provide:
1. Scores for each category (0-5): pronunciation, fluency, grammar, vocabulary, content
2. Overall score (${examType === "toeic" ? "0-200" : "predict OPIc level"})
3. 2-3 specific strengths
4. 2-3 specific suggestions for improvement

Respond in JSON format:
{
  "overallScore": number,
  "pronunciation": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "content": number,
  "predictedLevel": "string (only for OPIc)",
  "strengths": ["string"],
  "suggestions": ["string"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from GPT-4");
    }

    const parsed = JSON.parse(content);

    return {
      overallScore: parsed.overallScore || 0,
      pronunciation: parsed.pronunciation || 0,
      fluency: parsed.fluency || 0,
      grammar: parsed.grammar || 0,
      vocabulary: parsed.vocabulary || 0,
      content: parsed.content || 0,
      transcription,
      suggestions: parsed.suggestions || [],
      strengths: parsed.strengths || [],
      predictedLevel: parsed.predictedLevel,
    };
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
}

/**
 * Generate practice questions for TOEIC Speaking
 */
export async function generateTOEICQuestion(part: number): Promise<string> {
  const partInfo = TOEIC_SPEAKING_PARTS.find((p) => p.part === part);
  if (!partInfo) {
    throw new Error(`Invalid TOEIC Speaking part: ${part}`);
  }

  const prompts: Record<number, string> = {
    1: "Generate a short paragraph (3-4 sentences) suitable for a TOEIC Speaking read-aloud practice. Topics: business, announcements, or everyday situations.",
    2: "Generate a short paragraph (3-4 sentences) suitable for a TOEIC Speaking read-aloud practice. Topics: news, events, or public information.",
    3: "Generate a description prompt for a picture showing a typical workplace or public setting scene.",
    4: "Generate 3 simple questions about everyday topics like schedules, preferences, or experiences.",
    5: "Generate a scenario where someone has a problem (work, service, scheduling) that needs a solution.",
    6: "Generate a thought-provoking opinion question about work, technology, or society.",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a TOEIC Speaking test question generator. Create realistic, exam-style questions.",
        },
        { role: "user", content: prompts[part] },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Question generation error:", error);
    throw error;
  }
}

/**
 * Generate OPIc follow-up questions based on responses
 */
export async function generateOPIcFollowUp(
  topic: string,
  previousResponse: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an OPIc interviewer. Based on the candidate's response, generate a natural follow-up question that goes deeper into the topic or explores a related aspect.",
        },
        {
          role: "user",
          content: `Topic: ${topic}\nPrevious response: ${previousResponse}\n\nGenerate a follow-up question:`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Follow-up generation error:", error);
    throw error;
  }
}

/**
 * Calculate overall TOEIC Speaking score from individual scores
 */
export function calculateTOEICScore(feedbacks: SpeakingFeedback[]): number {
  if (feedbacks.length === 0) return 0;

  const avgScores = feedbacks.reduce(
    (acc, feedback) => {
      acc.pronunciation += feedback.pronunciation;
      acc.fluency += feedback.fluency;
      acc.grammar += feedback.grammar;
      acc.vocabulary += feedback.vocabulary;
      acc.content += feedback.content;
      return acc;
    },
    { pronunciation: 0, fluency: 0, grammar: 0, vocabulary: 0, content: 0 }
  );

  const count = feedbacks.length;
  const avgTotal =
    (avgScores.pronunciation +
      avgScores.fluency +
      avgScores.grammar +
      avgScores.vocabulary +
      avgScores.content) /
    (count * 5);

  // Convert 0-5 scale to 0-200
  return Math.round(avgTotal * 40);
}

/**
 * Determine OPIc level from feedback scores
 */
export function determineOPIcLevel(feedbacks: SpeakingFeedback[]): OPIcLevel {
  if (feedbacks.length === 0) return "IL";

  const avgScore =
    feedbacks.reduce((sum, f) => {
      return (
        sum +
        (f.pronunciation + f.fluency + f.grammar + f.vocabulary + f.content) / 5
      );
    }, 0) / feedbacks.length;

  if (avgScore >= 4.5) return "AL";
  if (avgScore >= 4.0) return "IH";
  if (avgScore >= 3.5) return "IM3";
  if (avgScore >= 3.0) return "IM2";
  if (avgScore >= 2.5) return "IM1";
  return "IL";
}
