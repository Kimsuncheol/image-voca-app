require("dotenv").config();
const { initializeApp } = require("firebase/app");
const {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} = require("firebase/firestore");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const courseConfigs = [
  ["수능", process.env.EXPO_PUBLIC_COURSE_PATH_CSAT],
  ["TOEIC", process.env.EXPO_PUBLIC_COURSE_PATH_TOEIC],
  ["TOEFL", process.env.EXPO_PUBLIC_COURSE_PATH_TOEFL],
  ["IELTS", process.env.EXPO_PUBLIC_COURSE_PATH_IELTS],
  ["COLLOCATION", process.env.EXPO_PUBLIC_COURSE_PATH_COLLOCATION],
];

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

async function getTotalDays(db, coursePath) {
  const courseDoc = await getDoc(doc(db, coursePath));
  if (!courseDoc.exists()) return 0;

  const totalDays = courseDoc.data().totalDays;
  return typeof totalDays === "number" && totalDays > 0 ? totalDays : 0;
}

async function backfillDay(db, coursePath, dayNumber) {
  const dayName = `Day${dayNumber}`;
  const snapshot = await getDocs(collection(db, coursePath, dayName));

  let updatedCount = 0;
  let skippedCount = 0;

  for (const vocabDoc of snapshot.docs) {
    const data = vocabDoc.data();
    const imageUrl = data.imageUrl;
    const legacyImage = data.image;

    if (isHttpUrl(imageUrl)) {
      skippedCount += 1;
      continue;
    }

    if (!isHttpUrl(legacyImage)) {
      skippedCount += 1;
      continue;
    }

    await updateDoc(vocabDoc.ref, { imageUrl: legacyImage.trim() });
    updatedCount += 1;
  }

  return { updatedCount, skippedCount, totalDocs: snapshot.size };
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [courseId, coursePath] of courseConfigs) {
    if (!coursePath) {
      console.log(`[skip] ${courseId}: missing course path`);
      continue;
    }

    const totalDays = await getTotalDays(db, coursePath);
    if (totalDays === 0) {
      console.log(`[skip] ${courseId}: no totalDays metadata`);
      continue;
    }

    console.log(`[start] ${courseId}: scanning ${totalDays} day collections`);

    for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
      const result = await backfillDay(db, coursePath, dayNumber);
      totalUpdated += result.updatedCount;
      totalSkipped += result.skippedCount;
      console.log(
        `[day] ${courseId} Day${dayNumber}: updated=${result.updatedCount} skipped=${result.skippedCount} total=${result.totalDocs}`,
      );
    }
  }

  console.log(`[done] imageUrl backfill updated=${totalUpdated} skipped=${totalSkipped}`);
}

main().catch((error) => {
  console.error("[error] failed to backfill vocabulary image URLs", error);
  process.exit(1);
});
