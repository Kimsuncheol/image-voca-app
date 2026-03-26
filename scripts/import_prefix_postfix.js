const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getAuth, signInAnonymously } = require("firebase/auth");
const { doc, getFirestore, setDoc } = require("firebase/firestore");
const {
  isValidFirestoreCollectionPath,
  mapPostfixRows,
  mapPrefixRows,
  normalizeFirestoreCollectionPath,
} = require("./lib/prefixPostfixSheetImport");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const prefixCollectionPath = normalizeFirestoreCollectionPath(
  process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX,
);
const postfixCollectionPath = normalizeFirestoreCollectionPath(
  process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX,
);

const args = process.argv.slice(2);

const getArgValue = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const prefixSource = getArgValue("--prefix-source");
const postfixSource = getArgValue("--postfix-source");

if (!firebaseConfig.apiKey) {
  console.error("Error: Missing Firebase config in .env");
  process.exit(1);
}

if (!isValidFirestoreCollectionPath(prefixCollectionPath)) {
  console.error(
    "Error: Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX in .env",
  );
  process.exit(1);
}

if (!isValidFirestoreCollectionPath(postfixCollectionPath)) {
  console.error(
    "Error: Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX in .env",
  );
  process.exit(1);
}

if (!prefixSource || !postfixSource) {
  console.error(
    "Error: Provide both --prefix-source and --postfix-source as CSV file paths or URLs.",
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const isUrl = (value) => /^https?:\/\//i.test(value);

const readSource = async (source) => {
  if (isUrl(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  const resolvedPath = path.resolve(process.cwd(), source);
  return fs.readFileSync(resolvedPath, "utf8");
};

const parseCsvRows = (content) =>
  parse(content, {
    bom: true,
    columns: (headers) => headers.map((header) => String(header).trim()),
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true,
  });

const writeRows = async (collectionPath, entries) => {
  let count = 0;

  for (const entry of entries) {
    const { id, ...payload } = entry;
    await setDoc(doc(db, collectionPath, id), payload, { merge: true });
    process.stdout.write(".");
    count += 1;
  }

  return count;
};

async function uploadData() {
  try {
    console.log("Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("Signed in as:", auth.currentUser.uid);
  } catch (error) {
    console.error("Auth failed:", error.message);
    process.exit(1);
  }

  console.log(`Reading prefix source: ${prefixSource}`);
  console.log(`Reading postfix source: ${postfixSource}`);

  const [prefixContent, postfixContent] = await Promise.all([
    readSource(prefixSource),
    readSource(postfixSource),
  ]);

  const prefixEntries = mapPrefixRows(parseCsvRows(prefixContent));
  const postfixEntries = mapPostfixRows(parseCsvRows(postfixContent));

  console.log(`Uploading prefixes to: ${prefixCollectionPath}`);
  const prefixCount = await writeRows(prefixCollectionPath, prefixEntries);
  console.log(`\nUpserted ${prefixCount} prefix documents.`);

  console.log(`Uploading postfixes to: ${postfixCollectionPath}`);
  const postfixCount = await writeRows(postfixCollectionPath, postfixEntries);
  console.log(`\nUpserted ${postfixCount} postfix documents.`);
}

uploadData().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
