# Image Voca App

Image Voca App is an Expo / React Native vocabulary learning app. It supports
course-based study, swipe cards, quizzes, word banks, study history, language
settings, speech preferences, Firebase authentication, and Firebase-backed
content.

## Tech Stack

- Expo SDK 54 with Expo Router
- React Native 0.81 and React 19
- TypeScript
- Firebase Auth, Firestore, Storage, Analytics, Hosting, and Cloud Functions
- Jest with `@testing-library/react-native`
- React Native Paper, Reanimated, Gesture Handler, and Zustand
- OpenAI API integration for generated language examples
- Google Mobile Ads integration for native builds

## Project Structure

```text
app/                    Expo Router screens and route layouts
components/             Reusable UI components grouped by feature
constants/              Shared theme, color, font, and layout constants
src/context/            App-level providers for auth, theme, tabs, and language
src/data/               Local seed/static vocabulary data
src/hooks/              Shared React hooks
src/locales/            i18n translation resources
src/services/           Firebase, vocabulary, speech, quiz, and data services
src/stores/             Zustand state stores
src/types/              Shared TypeScript types
src/utils/              Shared utility functions
functions/              Firebase Cloud Functions TypeScript project
scripts/                Data import and maintenance scripts
__tests__/              Jest test suite
docs/                   Additional implementation and operations docs
```

## Prerequisites

- Node.js 20 or newer
- npm
- Expo CLI through `npx expo`
- Firebase CLI for functions, hosting, and emulator workflows
- Xcode for iOS native builds
- Android Studio for Android native builds

## Setup

Install app dependencies:

```bash
npm install
```

Install Cloud Functions dependencies when working on Firebase Functions:

```bash
cd functions
npm install
cd ..
```

Create a local `.env` file in the project root. Expo exposes variables prefixed
with `EXPO_PUBLIC_` to the client bundle, so do not put private server secrets in
those variables.

Common app variables:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

EXPO_PUBLIC_OPENAI_API_KEY=

EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=

EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=
EXPO_PUBLIC_ADMOB_NATIVE_TOP_BANNER_ANDROID=
EXPO_PUBLIC_ADMOB_NATIVE_TOP_BANNER_IOS=

EXPO_PUBLIC_POP_QUIZ_ENGLISH=
EXPO_PUBLIC_POP_QUIZ_JAPANESE=
```

Course collection path variables used by vocabulary loading and import scripts:

```bash
EXPO_PUBLIC_COURSE_PATH_CSAT=
EXPO_PUBLIC_COURSE_PATH_CSAT_IDIOMS=
EXPO_PUBLIC_COURSE_PATH_TOEIC=
EXPO_PUBLIC_COURSE_PATH_TOEFL=
EXPO_PUBLIC_COURSE_PATH_IELTS=
EXPO_PUBLIC_COURSE_PATH_TOEFL_IELTS=
EXPO_PUBLIC_COURSE_PATH_EXTREMELY_ADVANCED=
EXPO_PUBLIC_COURSE_PATH_COLLOCATION=
EXPO_PUBLIC_COURSE_PATH_KANJI=
EXPO_PUBLIC_COURSE_PATH_JLPT_N1=
EXPO_PUBLIC_COURSE_PATH_JLPT_N2=
EXPO_PUBLIC_COURSE_PATH_JLPT_N3=
EXPO_PUBLIC_COURSE_PATH_JLPT_N4=
EXPO_PUBLIC_COURSE_PATH_JLPT_N5=
EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX=
EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX=
```

Firebase Functions use Firebase Secret Manager for private server secrets:

```bash
firebase functions:secrets:set TOSS_SECRET_KEY
```

## Development

Start Expo:

```bash
npm start
```

Run a platform target:

```bash
npm run ios
npm run android
npm run web
```

The app uses Expo Router. Main authenticated tabs live in `app/(tabs)`, auth
routes live in `app/(auth)`, and course flows live under `app/course` and
`app/courses`.

## Available Scripts

```bash
npm start                 # Start Expo
npm run ios               # Build and run on iOS
npm run android           # Build and run on Android
npm run web               # Start Expo for web
npm run lint              # Run Expo lint
npm test                  # Run Jest tests
npm run reset-project     # Run the local project reset helper
npm run import:counters   # Import counter data
npm run import:prefix-postfix
```

Additional maintenance scripts are available in `scripts/`, including CSAT
imports, vocabulary image URL backfills, and admin setup helpers.

## Testing

Run the full Jest suite:

```bash
npm test
```

Jest configuration is in `jest.config.js`, with shared setup in
`setup-jest.js`. Tests are stored in `__tests__/` and cover route screens,
course flows, quiz behavior, language settings, calendar history, word banks,
and shared utilities.

## Firebase

The project is configured with Firebase Hosting and Cloud Functions in
`firebase.json`.

Build functions:

```bash
npm --prefix functions run build
```

Run function emulators:

```bash
npm --prefix functions run serve
```

Deploy functions:

```bash
npm --prefix functions run deploy
```

Deploy from the root with the Firebase CLI when you need both configured
Firebase targets:

```bash
firebase deploy
```

## Data Imports

Seed data lives in `assets/data` and `src/data`. Import scripts use Firebase
client configuration from `.env`, so verify all required Firebase and course path
variables before running them.

```bash
npm run import:counters
npm run import:prefix-postfix
node scripts/import_csat.js
node scripts/backfill_vocabulary_image_urls.js
```

## Internationalization

Translations are loaded through `i18next` from `src/locales`. Current resources
include English, Korean, Japanese, Spanish, French, Russian, German, Italian,
and Hindi. Language settings are synchronized with device locales and persisted
with AsyncStorage.

## Native Notes

- Google Mobile Ads is disabled automatically on web and Expo Go, and initialized
  only when the native module is available.
- Push notification settings are configured through the Expo Notifications plugin.
- Android includes `WRITE_SETTINGS` for reading-display and brightness-related
  features.
- The app uses a custom Expo config plugin in `plugins/with-adi-registration.js`.

## Related Docs

- `SECURITY.md`
- `privacy-policy.md`
- `docs/ACCOUNT_DELETION_TEST.md`
- `docs/MEMBER_ADMINISTRATION_SRS.md`
- `docs/firestore-pop-quiz-rules.md`
- `METADATA_IMPLEMENTATION_SUMMARY.md`
- `METADATA_TESTING_GUIDE.md`
