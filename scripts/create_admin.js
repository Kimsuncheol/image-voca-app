require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');

// 1. Configure Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const EMAIL = 'BenjaminAdmin@example.com';
const PASSWORD = 'iphone12s@';

async function createAdmin() {
  console.log(`Attempting to create admin user: ${EMAIL}`);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log("Successfully created admin user:", userCredential.user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("User already exists. Attempting to sign in...");
      try {
        const userCredential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        console.log("Successfully signed in as admin:", userCredential.user.uid);
      } catch (signInError) {
        console.error("Error signing in:", signInError.message);
      }
    } else {
      console.error("Error creating user:", error.message);
    }
  }
}

createAdmin();
