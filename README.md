# image-voca-app

## App setup

```bash
npm install
npx expo start
```

## OpenAI TTS setup

The mobile app expects a public function URL in `.env`. Use the new env var name going forward:

```bash
EXPO_PUBLIC_OPENAI_TTS_ENDPOINT=https://<region>-<project>.cloudfunctions.net/qwenTtsSynthesize
```

The app still accepts the legacy env var name as a compatibility alias:

```bash
EXPO_PUBLIC_QWEN_TTS_ENDPOINT=https://<region>-<project>.cloudfunctions.net/qwenTtsSynthesize
```

The Firebase function reads the provider secret from Firebase Secrets:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Deploy the function from the repo root:

```bash
cd functions && npm install
cd ..
firebase deploy --only functions:qwenTtsSynthesize
```
