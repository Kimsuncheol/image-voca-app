# IPA Auto-Fetch Integration Guide

This guide shows how to integrate the Wiktionary IPA auto-fetch feature into your vocabulary app.

## 📦 What's Included

1. **Service Module** (`wiktionaryIpaService.ts`)
   - Fetches IPA from Wiktionary MediaWiki API
   - Parses US and UK pronunciations
   - In-memory caching
   - Error handling & timeouts

2. **UI Component** (`IpaInputField.tsx`)
   - Ready-to-use input component
   - Auto-fetches when word changes
   - Manual refresh option
   - Visual feedback for missing data

## 🚀 Quick Start

### Option 1: Use the IpaInputField Component (Recommended)

```tsx
import { IpaInputField } from "../../src/components/admin/IpaInputField";

function AddWordForm() {
  const [word, setWord] = useState("");
  const [ipaUS, setIpaUS] = useState("");
  const [ipaUK, setIpaUK] = useState("");

  return (
    <View>
      <TextInput
        placeholder="Enter word"
        value={word}
        onChangeText={setWord}
      />

      <IpaInputField
        word={word}
        ipaUS={ipaUS}
        ipaUK={ipaUK}
        onChangeIpaUS={setIpaUS}
        onChangeIpaUK={setIpaUK}
        isDark={isDark}
        autoFetch={true}
      />

      {/* Rest of your form... */}
    </View>
  );
}
```

### Option 2: Use the Service Directly

```tsx
import { getIpaUSUK } from "../../src/services/ipa/wiktionaryIpaService";

async function handleAddWord(word: string) {
  // Fetch IPA pronunciations
  const ipaResult = await getIpaUSUK(word);

  if (ipaResult.source === "wiktionary") {
    console.log("US IPA:", ipaResult.us);  // "/ˈhɛloʊ/"
    console.log("UK IPA:", ipaResult.uk);  // "/həˈləʊ/"

    // Use the IPA in your vocabulary data
    const vocabularyData = {
      word,
      ipaUS: ipaResult.us || "",
      ipaUK: ipaResult.uk || "",
      // ... other fields
    };

    // Save to Firestore or wherever...
  } else {
    console.log("IPA not found, user must enter manually");
  }
}
```

## 📝 Integration with CSV Import (add-voca.tsx)

To enhance your existing CSV import workflow, add IPA fetching after parsing:

```tsx
// In add-voca.tsx, inside the uploadData function

const uploadData = async (data: any[], day: string) => {
  // ... existing code ...

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const word = String(item["Word"] || "").trim();

    // Fetch IPA if pronunciation field is empty
    let ipaUS = String(item["IPA_US"] || item["Pronunciation"] || "").trim();
    let ipaUK = String(item["IPA_UK"] || "").trim();

    if (!ipaUS || !ipaUK) {
      setProgress(`Fetching IPA for "${word}" (${i + 1}/${data.length})...`);

      const ipaResult = await getIpaUSUK(word);

      if (ipaResult.source === "wiktionary") {
        if (!ipaUS && ipaResult.us) {
          ipaUS = ipaResult.us;
        }
        if (!ipaUK && ipaResult.uk) {
          ipaUK = ipaResult.uk;
        }
      }
    }

    const docData = {
      word,
      ipaUS,
      ipaUK,
      meaning: String(item["Meaning"] || "").trim(),
      // ... rest of fields
    };

    await addDoc(collection(db, fullPath), docData);
  }
};
```

## 🎯 Batch Import Example

For importing multiple words efficiently:

```tsx
import { batchGetIpaUSUK } from "../../src/services/ipa/wiktionaryIpaService";

async function importMultipleWords(words: string[]) {
  const ipaResults = await batchGetIpaUSUK(
    words,
    (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    }
  );

  // Process results
  words.forEach(word => {
    const result = ipaResults.get(word);
    if (result?.source === "wiktionary") {
      console.log(`${word}: US=${result.us}, UK=${result.uk}`);
    }
  });
}
```

## 🔧 Advanced Usage

### Caching

The service includes automatic in-memory caching. To clear cache:

```tsx
import { clearIpaCache } from "../../src/services/ipa/wiktionaryIpaService";

// Clear cache when needed (e.g., on app restart)
clearIpaCache();
```

### Custom Timeout

The default timeout is 8 seconds. To modify, edit the constant in `wiktionaryIpaService.ts`:

```tsx
const REQUEST_TIMEOUT = 10000; // 10 seconds
```

### Handling Errors

The service returns gracefully even on errors:

```tsx
const result = await getIpaUSUK("nonexistentword123");
// result = { us: null, uk: null, source: "none" }

// Always check the source
if (result.source === "wiktionary") {
  // Successfully fetched
} else {
  // Failed or not found - allow manual entry
}
```

## 📊 Data Structure Updates

Consider updating your Firestore vocabulary schema to store both US and UK IPA:

```typescript
interface VocabularyItem {
  word: string;
  meaning: string;
  ipaUS?: string;  // US pronunciation
  ipaUK?: string;  // UK pronunciation
  pronunciation?: string; // Legacy field (deprecated)
  example: string;
  translation: string;
  createdAt: Date;
}
```

## 🎨 UI/UX Best Practices

1. **Loading States**: Show spinner while fetching
2. **Fallback**: Always allow manual editing
3. **Validation**: Don't require IPA - treat as optional enhancement
4. **Feedback**: Show clear message when auto-fetch fails
5. **Debouncing**: Component auto-debounces (500ms) to avoid excessive API calls

## 🧪 Testing

Test with various words:

```tsx
// Words with clear US/UK differences
await getIpaUSUK("color");    // Different pronunciations
await getIpaUSUK("schedule"); // Very different!

// Complex words
await getIpaUSUK("worcestershire"); // Should handle well

// Non-existent
await getIpaUSUK("xyzabc123"); // Should return null gracefully
```

## ⚠️ Limitations

1. **Best-effort parsing**: Wiktionary format varies; not all words parse perfectly
2. **English only**: Currently only supports English Wiktionary
3. **No offline support**: Requires internet connection
4. **Rate limiting**: Built-in delays (100ms between batch requests) to be respectful
5. **IPA symbols**: May need special fonts to display properly

## 🔐 Privacy & Attribution

- **No API key required**: Wiktionary API is free and open
- **Attribution**: Consider adding "Pronunciations from Wiktionary" in your app credits
- **License**: Wiktionary content is CC BY-SA 3.0

## 📱 Mobile Considerations

- **Network**: Check connectivity before fetching
- **Battery**: Cache helps reduce unnecessary requests
- **Performance**: Fetches are async and non-blocking
- **Memory**: Cache is limited to 500 entries (configurable)

## 🚨 Error Scenarios Handled

✅ Network timeout (8s limit)
✅ Word not found on Wiktionary
✅ No pronunciation section
✅ Malformed response
✅ Empty/invalid input
✅ HTTP errors (404, 500, etc.)
✅ JSON parse errors

All errors are logged to console but don't crash the app.

---

## 💡 Example: Complete Add Word Flow

```tsx
import React, { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { IpaInputField } from "../../src/components/admin/IpaInputField";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../src/services/firebase";

export function AddWordScreen({ courseId, day }: { courseId: string; day: string }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [ipaUS, setIpaUS] = useState("");
  const [ipaUK, setIpaUK] = useState("");
  const [example, setExample] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!word || !meaning) {
      Alert.alert("Error", "Word and meaning are required");
      return;
    }

    setLoading(true);

    try {
      const docData = {
        word,
        meaning,
        ipaUS,
        ipaUK,
        example,
        createdAt: new Date(),
      };

      const path = `courses/${courseId}/Day${day}`;
      await addDoc(collection(db, path), docData);

      Alert.alert("Success", "Word added successfully!");

      // Reset form
      setWord("");
      setMeaning("");
      setIpaUS("");
      setIpaUK("");
      setExample("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Word"
        value={word}
        onChangeText={setWord}
        style={{ marginBottom: 16 }}
      />

      <IpaInputField
        word={word}
        ipaUS={ipaUS}
        ipaUK={ipaUK}
        onChangeIpaUS={setIpaUS}
        onChangeIpaUK={setIpaUK}
        autoFetch={true}
      />

      <TextInput
        placeholder="Meaning"
        value={meaning}
        onChangeText={setMeaning}
        style={{ marginBottom: 16 }}
      />

      <TextInput
        placeholder="Example sentence"
        value={example}
        onChangeText={setExample}
        style={{ marginBottom: 16 }}
      />

      <Button
        title="Add Word"
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}
```

---

**Need help?** Check the inline comments in `wiktionaryIpaService.ts` or open an issue.
