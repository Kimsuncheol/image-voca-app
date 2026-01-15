const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

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

// Basic validation
if (!firebaseConfig.apiKey) {
  console.error("Error: Missing Firebase Config in .env");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Read CSV
const csvFilePath = path.join(__dirname, '../assets/spreadsheet/CSAT_Day1.csv');
console.log(`Reading CSV from: ${csvFilePath}`);

const fileContent = fs.readFileSync(csvFilePath, 'utf8');

// 3. Parse CSV
// The file has a header on line 2, and empty column 0.
const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  from_line: 2, // The header is on line 2
  relax_quotes: true, // Helpful for some messy CSVs
  trim: true
});

// 4. Transform and Upload
const TARGET_COLLECTION = 'voca/pdw9crwerFb2qGFltJJY/course/BKQz1pqPyizbHzi1RxKK/CSAT/mNaFSzquidDTdaOq1cS0/CSAT1_Day1';
const auth = getAuth(app);

async function uploadData() {
  try {
    console.log("Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("Signed in as:", auth.currentUser.uid);
  } catch (e) {
    console.error("Auth failed:", e.message);
    process.exit(1);
  }

  console.log(`Found ${records.length} records.`);
  console.log(`Uploading to collection: ${TARGET_COLLECTION}...`);

  let count = 0;
  for (const record of records) {
    // Mapping:
    // The CSV parser with 'columns: true' uses the header row keys.
    // Headers: '', 'Word', 'Meaning', 'Pronounciation', 'Example sentence'
    // Note the empty key for the first column.
    
    const word = record['Word'];
    if (!word) continue; // Skip empty rows

    const docData = {
      word: word,
      meaning: record['Meaning'],
      pronunciation: record['Pronounciation'] || '',
      example: record['Example sentence'] || '',
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, TARGET_COLLECTION), docData);
      process.stdout.write('.');
      count++;
    } catch (e) {
      console.error(`\nFailed to upload ${word}:`, e.message);
    }
  }

  console.log(`\nSuccessfully uploaded ${count} documents.`);
}

uploadData();
