import 'react-native-gesture-handler/jestSetup';
import { jest } from "@jest/globals";

jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

process.env.EXPO_PUBLIC_COURSE_PATH_CSAT = "courses/csat";
process.env.EXPO_PUBLIC_COURSE_PATH_CSAT_IDIOMS = "courses/csat-idioms";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC = "courses/toeic";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL = "courses/toefl";
process.env.EXPO_PUBLIC_COURSE_PATH_IELTS = "courses/ielts";
process.env.EXPO_PUBLIC_COURSE_PATH_EXTREMELY_ADVANCED = "courses/extremely-advanced";
process.env.EXPO_PUBLIC_COURSE_PATH_OPIC = "courses/opic";
process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC_SPEAKING = "courses/toeic-speaking";
process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION = "courses/collocation";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N1 = "courses/jlpt/n1";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N2 = "courses/jlpt/n2";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N3 = "courses/jlpt/n3";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N4 = "courses/jlpt/n4";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_N5 = "courses/jlpt/n5";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX = "reference/jlpt/prefix";
process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX = "reference/jlpt/postfix";
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

jest.mock("expo-speech", () => ({
  maxSpeechInputLength: 4000,
  speak: jest.fn(),
  stop: jest.fn(async () => undefined),
  pause: jest.fn(async () => undefined),
  resume: jest.fn(async () => undefined),
  isSpeakingAsync: jest.fn(async () => false),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: {
    SHA256: "SHA256",
  },
  digestStringAsync: jest.fn(async (_algorithm, value) => `hash:${value}`),
}));

jest.mock("react-native-google-mobile-ads", () => {
  const React = require("react");
  const { View } = require("react-native");

  const NativeAdEventType = {
    CLICKED: "clicked",
    OPENED: "opened",
  };

  const mockNativeAdState = {
    current: null,
    lastRequest: null,
    emit(type, payload) {
      this.current?.__listeners?.get(type)?.(payload);
    },
  };

  const buildNativeAd = (overrides = {}) => {
    const listeners = new Map();

    const ad = {
      responseId: "test-response-id",
      advertiser: "Mock Advertiser",
      body: "Mock Body",
      callToAction: "Open",
      headline: "Mock App",
      price: "Free",
      store: "App Store",
      starRating: 4.8,
      icon: { url: "https://cdn.example.com/icon.png", scale: 1 },
      images: null,
      mediaContent: {
        aspectRatio: 1,
        hasVideoContent: false,
        duration: 0,
      },
      extras: null,
      addAdEventListener: jest.fn((type, listener) => {
        listeners.set(type, listener);
        const subscription = {
          remove: jest.fn(() => {
            listeners.delete(type);
          }),
        };

        if (!ad.__subscriptions) {
          ad.__subscriptions = {};
        }
        ad.__subscriptions[type] = subscription;
        return subscription;
      }),
      removeAllAdEventListeners: jest.fn(() => {
        listeners.clear();
      }),
      destroy: jest.fn(),
      __listeners: listeners,
      __subscriptions: {},
      ...overrides,
    };

    mockNativeAdState.current = ad;
    return ad;
  };

  const createNativeAd = jest.fn(async (adUnitId, options) => {
    mockNativeAdState.lastRequest = { adUnitId, options };
    return buildNativeAd();
  });

  const NativeAdView = ({ children, ...props }) =>
    React.createElement(View, props, children);
  const NativeAsset = ({ children, assetType }) =>
    React.createElement(View, { testID: `native-asset-${assetType}` }, children);

  const mobileAds = () => ({
    initialize: jest.fn(async () => ({ adapterStatuses: [] })),
  });

  return {
    __esModule: true,
    default: mobileAds,
    TestIds: {
      NATIVE: "test-native-unit-id",
    },
    NativeAd: {
      createForAdRequest: createNativeAd,
    },
    NativeAdEventType,
    NativeAdView,
    NativeAsset,
    NativeAssetType: {
      ICON: "icon",
      HEADLINE: "headline",
      STAR_RATING: "starRating",
      STORE: "store",
      PRICE: "price",
      CALL_TO_ACTION: "callToAction",
    },
    __mockNativeAd: mockNativeAdState,
  };
});

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
