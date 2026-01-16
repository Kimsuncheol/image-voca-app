import { create } from "zustand";
import {
    ExamType,
    OPIC_TOPICS,
    OPIcLevel,
    OPIcTopic,
    SpeakingFeedback,
    TOEIC_SPEAKING_PARTS,
    analyzeSpeakingResponse,
    calculateTOEICScore,
    determineOPIcLevel,
    generateTOEICQuestion,
    transcribeAudio
} from "../services/aiSpeakingService";

export interface SpeakingQuestion {
  id: string;
  prompt: string;
  part?: number; // For TOEIC
  topic?: OPIcTopic; // For OPIc
  prepTime: number;
  responseTime: number;
}

export interface RecordingResult {
  questionId: string;
  audioUri: string;
  duration: number;
}

export interface SpeakingSession {
  id: string;
  examType: ExamType;
  startedAt: string;
  completedAt?: string;
  questions: SpeakingQuestion[];
  recordings: RecordingResult[];
  feedbacks: SpeakingFeedback[];
  currentQuestionIndex: number;
  overallScore?: number;
  predictedLevel?: OPIcLevel;
}

interface SpeakingTutorState {
  // Current session
  currentSession: SpeakingSession | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Recording state
  isRecording: boolean;
  recordingUri: string | null;

  // Timer state
  timerMode: "prep" | "response" | "idle";
  timerSeconds: number;

  // Actions
  startTOEICSession: (parts: number[]) => Promise<void>;
  startOPIcSession: (targetLevel: OPIcLevel, topics: string[]) => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;

  // Recording actions
  setRecording: (isRecording: boolean, uri?: string) => void;
  submitRecording: (audioUri: string) => Promise<void>;

  // Timer actions
  startPrepTimer: () => void;
  startResponseTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;

  // Session management
  completeSession: () => void;
  resetSession: () => void;

  // Getters
  getCurrentQuestion: () => SpeakingQuestion | null;
  getProgress: () => { current: number; total: number };
}

export const useSpeakingTutorStore = create<SpeakingTutorState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  isAnalyzing: false,
  error: null,
  isRecording: false,
  recordingUri: null,
  timerMode: "idle",
  timerSeconds: 0,

  startTOEICSession: async (parts: number[]) => {
    set({ isLoading: true, error: null });
    try {
      const questions: SpeakingQuestion[] = [];

      for (const partNum of parts) {
        const partInfo = TOEIC_SPEAKING_PARTS.find((p) => p.part === partNum);
        if (!partInfo) continue;

        const prompt = await generateTOEICQuestion(partNum);

        questions.push({
          id: `toeic-part${partNum}-${Date.now()}`,
          prompt,
          part: partNum,
          prepTime: partInfo.prepTime,
          responseTime: partInfo.responseTime,
        });
      }

      const session: SpeakingSession = {
        id: `toeic-${Date.now()}`,
        examType: "toeic",
        startedAt: new Date().toISOString(),
        questions,
        recordings: [],
        feedbacks: [],
        currentQuestionIndex: 0,
      };

      set({ currentSession: session, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to start TOEIC session",
        isLoading: false,
      });
    }
  },

  startOPIcSession: async (targetLevel: OPIcLevel, topicIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const questions: SpeakingQuestion[] = [];

      for (const topicId of topicIds) {
        const topic = OPIC_TOPICS.find((t) => t.id === topicId);
        if (!topic) continue;

        // Add 2-3 questions per topic
        const numQuestions = Math.min(topic.questions.length, 3);
        for (let i = 0; i < numQuestions; i++) {
          questions.push({
            id: `opic-${topicId}-${i}-${Date.now()}`,
            prompt: topic.questions[i],
            topic,
            prepTime: 20, // OPIc typically has shorter prep time
            responseTime: 60,
          });
        }
      }

      const session: SpeakingSession = {
        id: `opic-${Date.now()}`,
        examType: "opic",
        startedAt: new Date().toISOString(),
        questions,
        recordings: [],
        feedbacks: [],
        currentQuestionIndex: 0,
      };

      set({ currentSession: session, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to start OPIc session",
        isLoading: false,
      });
    }
  },

  nextQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      set({
        currentSession: {
          ...currentSession,
          currentQuestionIndex: currentSession.currentQuestionIndex + 1,
        },
        timerMode: "idle",
        timerSeconds: 0,
        isRecording: false,
        recordingUri: null,
      });
    }
  },

  previousQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    if (currentSession.currentQuestionIndex > 0) {
      set({
        currentSession: {
          ...currentSession,
          currentQuestionIndex: currentSession.currentQuestionIndex - 1,
        },
        timerMode: "idle",
        timerSeconds: 0,
        isRecording: false,
        recordingUri: null,
      });
    }
  },

  setRecording: (isRecording: boolean, uri?: string) => {
    set({ isRecording, recordingUri: uri || null });
  },

  submitRecording: async (audioUri: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    if (!currentQuestion) return;

    set({ isAnalyzing: true, error: null });

    try {
      // Transcribe audio
      const transcription = await transcribeAudio(audioUri);

      // Get part info for TOEIC
      const partInfo = currentQuestion.part
        ? TOEIC_SPEAKING_PARTS.find((p) => p.part === currentQuestion.part)
        : undefined;

      // Analyze response
      const feedback = await analyzeSpeakingResponse(
        transcription,
        currentSession.examType,
        currentQuestion.prompt,
        partInfo
      );

      // Update session with recording and feedback
      const newRecording: RecordingResult = {
        questionId: currentQuestion.id,
        audioUri,
        duration: currentQuestion.responseTime,
      };

      set({
        currentSession: {
          ...currentSession,
          recordings: [...currentSession.recordings, newRecording],
          feedbacks: [...currentSession.feedbacks, feedback],
        },
        isAnalyzing: false,
        recordingUri: null,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to analyze recording",
        isAnalyzing: false,
      });
    }
  },

  startPrepTimer: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    if (!currentQuestion) return;

    set({
      timerMode: "prep",
      timerSeconds: currentQuestion.prepTime,
    });
  },

  startResponseTimer: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
    if (!currentQuestion) return;

    set({
      timerMode: "response",
      timerSeconds: currentQuestion.responseTime,
    });
  },

  tickTimer: () => {
    const { timerSeconds, timerMode } = get();
    if (timerMode === "idle" || timerSeconds <= 0) return;

    set({ timerSeconds: timerSeconds - 1 });
  },

  resetTimer: () => {
    set({ timerMode: "idle", timerSeconds: 0 });
  },

  completeSession: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    let overallScore: number | undefined;
    let predictedLevel: OPIcLevel | undefined;

    if (currentSession.feedbacks.length > 0) {
      if (currentSession.examType === "toeic") {
        overallScore = calculateTOEICScore(currentSession.feedbacks);
      } else {
        predictedLevel = determineOPIcLevel(currentSession.feedbacks);
      }
    }

    set({
      currentSession: {
        ...currentSession,
        completedAt: new Date().toISOString(),
        overallScore,
        predictedLevel,
      },
    });
  },

  resetSession: () => {
    set({
      currentSession: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,
      isRecording: false,
      recordingUri: null,
      timerMode: "idle",
      timerSeconds: 0,
    });
  },

  getCurrentQuestion: () => {
    const { currentSession } = get();
    if (!currentSession) return null;
    return currentSession.questions[currentSession.currentQuestionIndex] || null;
  },

  getProgress: () => {
    const { currentSession } = get();
    if (!currentSession) return { current: 0, total: 0 };
    return {
      current: currentSession.currentQuestionIndex + 1,
      total: currentSession.questions.length,
    };
  },
}));
