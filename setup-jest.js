import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props) => React.createElement(View, { ...props, testID: 'mock-expo-image' }),
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
