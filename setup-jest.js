import 'react-native-gesture-handler/jestSetup';

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

process.env.EXPO_PUBLIC_COURSE_PATH_CSAT = "courses/csat";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC = "courses/toeic";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL = "courses/toefl";
process.env.EXPO_PUBLIC_COURSE_PATH_IELTS = "courses/ielts";
process.env.EXPO_PUBLIC_COURSE_PATH_OPIC = "courses/opic";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING = "courses/toeic-speaking";
process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION = "courses/collocation";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N1 = "courses/jlpt/n1";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N2 = "courses/jlpt/n2";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N3 = "courses/jlpt/n3";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N4 = "courses/jlpt/n4";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N5 = "courses/jlpt/n5";
process.env.EXPO_PUBLIC_OPENAI_TTS_ENDPOINT = "https://example.com/openai-tts";
process.env.EXPO_PUBLIC_QWEN_TTS_ENDPOINT = "https://example.com/qwen-tts";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockExpoImage = (props) =>
    React.createElement(View, { ...props, testID: 'mock-expo-image' });
  MockExpoImage.prefetch = jest.fn(async () => true);
  return {
    Image: MockExpoImage,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const Icon = ({ name, testID, ...props }) =>
    React.createElement(Text, { ...props, testID: testID ?? `icon-${name}` }, name);

  return {
    Ionicons: Icon,
  };
});

jest.mock("expo-av", () => {
  const playbackStatus = {
    isLoaded: true,
    isPlaying: false,
    didJustFinish: false,
    positionMillis: 0,
    durationMillis: 1000,
  };

  const createSound = () => ({
    setOnPlaybackStatusUpdate: jest.fn(),
    unloadAsync: jest.fn(async () => playbackStatus),
    playAsync: jest.fn(async () => ({ ...playbackStatus, isPlaying: true })),
    pauseAsync: jest.fn(async () => ({ ...playbackStatus, isPlaying: false })),
    setRateAsync: jest.fn(async () => playbackStatus),
  });

  return {
    Audio: {
      setAudioModeAsync: jest.fn(async () => undefined),
      Sound: {
        createAsync: jest.fn(async (_source, _initialStatus, onPlaybackStatusUpdate) => {
          const sound = createSound();
          sound.setOnPlaybackStatusUpdate.mockImplementation(() => undefined);
          if (onPlaybackStatusUpdate) {
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
          }
          return {
            sound,
            status: playbackStatus,
          };
        }),
      },
    },
  };
});

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///mock-cache/",
  EncodingType: {
    Base64: "base64",
  },
  getInfoAsync: jest.fn(async () => ({ exists: false, isDirectory: false })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  writeAsStringAsync: jest.fn(async () => undefined),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: {
    SHA256: "SHA256",
  },
  digestStringAsync: jest.fn(async (_algorithm, value) => `hash:${value}`),
}));

jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  pause: jest.fn(async () => undefined),
  resume: jest.fn(async () => undefined),
  getAvailableVoicesAsync: jest.fn(async () => [
    { identifier: "en-us-voice", language: "en-US" },
    { identifier: "ko-kr-voice", language: "ko-KR" },
    { identifier: "ja-jp-voice", language: "ja-JP" },
  ]),
}));

jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
    getApp: jest.fn(),
    FirebaseError: class FirebaseError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    }
  };
});
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => ({})),
    signInWithEmailAndPassword: jest.fn(),
    initializeAuth: jest.fn(),
    getReactNativePersistence: jest.fn(),
    onAuthStateChanged: jest.fn()
  };
});
