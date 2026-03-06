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

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props) => React.createElement(View, { ...props, testID: 'mock-expo-image' }),
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
