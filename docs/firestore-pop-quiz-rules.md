# Firestore Pop Quiz Rules Snippet

This app reads pop-quiz data directly from Firestore, but this repository does
not currently own the full production `firestore.rules` file. Add the snippet
below to the deployed ruleset that owns the configured pop-quiz paths.

The mobile app expects read-only access to documents shaped like:

- `.../English/{docId}/matching/data`
- `.../Japanese/{docId}/matching/data`

The `data` document then stores generated days under:

- `courses.{course}.days.{day}` for English
- `levels.{level}.days.{day}` for Japanese

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Replace /pop-quiz/root with the collection prefix used by
    // EXPO_PUBLIC_POP_QUIZ_ENGLISH and EXPO_PUBLIC_POP_QUIZ_JAPANESE.
    match /pop-quiz/root/{language}/{docId}/matching/data {
      allow read: if request.auth != null
        && (language == "English" || language == "Japanese");
      allow write: if false;
    }
  }
}
```

If the configured collection paths include additional fixed path segments,
mirror those segments exactly in the `match` pattern. The mobile app should not
be granted write access to pop-quiz documents.
