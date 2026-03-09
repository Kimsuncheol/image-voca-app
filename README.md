# image-voca-app

## App setup

```bash
npm install
npx expo start
```

## Qwen3-TTS setup

The mobile app expects a public function URL in `.env`:

```bash
EXPO_PUBLIC_QWEN_TTS_ENDPOINT=https://<region>-<project>.cloudfunctions.net/qwenTtsSynthesize
```

The Firebase function reads the provider secret from Firebase Secrets:

```bash
firebase functions:secrets:set QWEN_TTS_API_KEY
```

Deploy the function from the repo root:

```bash
cd functions && npm install
cd ..
firebase deploy --only functions:qwenTtsSynthesize
```
