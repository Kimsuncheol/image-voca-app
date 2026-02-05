/**
 * =============================================================================
 * IPA AUTO-FETCH USAGE EXAMPLES
 * =============================================================================
 * This file demonstrates various ways to use the Wiktionary IPA service.
 * Copy and adapt these examples for your specific use cases.
 * =============================================================================
 */

import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { batchGetIpaUSUK, clearIpaCache, getIpaUSUK } from "./wiktionaryIpaService";

// =============================================================================
// EXAMPLE 1: Simple IPA Fetch
// =============================================================================

export function Example1_SimpleFetch() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState("");

  const handleFetch = async () => {
    if (!word) return;

    const ipa = await getIpaUSUK(word);

    if (ipa.source === "wiktionary") {
      setResult(`US: ${ipa.us || "Not found"}\nUK: ${ipa.uk || "Not found"}`);
    } else {
      setResult("Could not fetch IPA from Wiktionary");
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter a word"
        value={word}
        onChangeText={setWord}
      />
      <Button title="Fetch IPA" onPress={handleFetch} />
      {result ? <Text>{result}</Text> : null}
    </View>
  );
}

// =============================================================================
// EXAMPLE 2: Add Word Form with Auto-Fetch
// =============================================================================

export function Example2_AddWordForm() {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [ipaUS, setIpaUS] = useState("");
  const [ipaUK, setIpaUK] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fetch IPA when word is entered
  const handleWordChange = async (newWord: string) => {
    setWord(newWord);

    // Only fetch if word is not empty and has changed
    if (newWord.trim()) {
      setLoading(true);
      const ipa = await getIpaUSUK(newWord);
      setLoading(false);

      if (ipa.source === "wiktionary") {
        if (ipa.us) setIpaUS(ipa.us);
        if (ipa.uk) setIpaUK(ipa.uk);
      }
    }
  };

  const handleSubmit = () => {
    const wordData = {
      word,
      meaning,
      ipaUS,
      ipaUK,
    };

    console.log("Submitting word:", wordData);
    Alert.alert("Success", "Word added!");

    // Reset form
    setWord("");
    setMeaning("");
    setIpaUS("");
    setIpaUK("");
  };

  return (
    <View>
      <TextInput
        placeholder="Word"
        value={word}
        onChangeText={handleWordChange}
      />

      <Text>US Pronunciation (IPA)</Text>
      <TextInput
        placeholder="/ˈhɛloʊ/"
        value={ipaUS}
        onChangeText={setIpaUS}
        editable={!loading}
      />

      <Text>UK Pronunciation (IPA)</Text>
      <TextInput
        placeholder="/həˈləʊ/"
        value={ipaUK}
        onChangeText={setIpaUK}
        editable={!loading}
      />

      <TextInput
        placeholder="Meaning"
        value={meaning}
        onChangeText={setMeaning}
      />

      <Button title="Add Word" onPress={handleSubmit} disabled={loading} />
    </View>
  );
}

// =============================================================================
// EXAMPLE 3: Batch Import with Progress
// =============================================================================

export function Example3_BatchImport() {
  const [words] = useState([
    "hello",
    "world",
    "computer",
    "schedule",
    "pronunciation",
  ]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Map<string, any>>(new Map());
  const [importing, setImporting] = useState(false);

  const handleBatchImport = async () => {
    setImporting(true);
    setProgress(0);

    const ipaResults = await batchGetIpaUSUK(
      words,
      (completed, total) => {
        setProgress(Math.round((completed / total) * 100));
      }
    );

    setResults(ipaResults);
    setImporting(false);
  };

  return (
    <View>
      <Text>Words to import: {words.join(", ")}</Text>

      <Button
        title="Start Batch Import"
        onPress={handleBatchImport}
        disabled={importing}
      />

      {importing && <Text>Progress: {progress}%</Text>}

      {results.size > 0 && (
        <View>
          <Text>Results:</Text>
          {Array.from(results.entries()).map(([word, ipa]) => (
            <Text key={word}>
              {word}: US={ipa.us || "N/A"}, UK={ipa.uk || "N/A"}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// EXAMPLE 4: CSV Import Enhancement
// =============================================================================

/**
 * Example of enhancing CSV import with auto-fetched IPA
 * This shows how to integrate with your existing add-voca.tsx workflow
 */
export async function Example4_EnhanceCSVRow(csvRow: any) {
  const word = String(csvRow["Word"] || "").trim();
  let ipaUS = String(csvRow["IPA_US"] || csvRow["Pronunciation"] || "").trim();
  let ipaUK = String(csvRow["IPA_UK"] || "").trim();

  // Only fetch if IPA fields are missing
  if (!ipaUS || !ipaUK) {
    console.log(`Fetching IPA for "${word}"...`);

    const ipaResult = await getIpaUSUK(word);

    if (ipaResult.source === "wiktionary") {
      if (!ipaUS && ipaResult.us) {
        ipaUS = ipaResult.us;
        console.log(`  ✓ Fetched US IPA: ${ipaUS}`);
      }
      if (!ipaUK && ipaResult.uk) {
        ipaUK = ipaResult.uk;
        console.log(`  ✓ Fetched UK IPA: ${ipaUK}`);
      }
    } else {
      console.log(`  ✗ IPA not found for "${word}"`);
    }
  }

  return {
    word,
    meaning: String(csvRow["Meaning"] || "").trim(),
    ipaUS,
    ipaUK,
    example: String(csvRow["Example"] || "").trim(),
    translation: String(csvRow["Translation"] || "").trim(),
  };
}

// =============================================================================
// EXAMPLE 5: Using with Form Validation
// =============================================================================

export function Example5_WithValidation() {
  const [word, setWord] = useState("");
  const [ipaUS, setIpaUS] = useState("");
  const [ipaUK, setIpaUK] = useState("");
  const [errors, setErrors] = useState({ word: "", ipa: "" });

  const validateAndFetchIPA = async () => {
    const newErrors = { word: "", ipa: "" };

    // Validate word
    if (!word.trim()) {
      newErrors.word = "Word is required";
      setErrors(newErrors);
      return false;
    }

    // Attempt to fetch IPA
    try {
      const ipa = await getIpaUSUK(word);

      if (ipa.source === "wiktionary") {
        if (ipa.us) setIpaUS(ipa.us);
        if (ipa.uk) setIpaUK(ipa.uk);

        // Warn if both are missing
        if (!ipa.us && !ipa.uk) {
          newErrors.ipa = "IPA not found; please enter manually";
        }
      } else {
        newErrors.ipa = "Could not auto-fetch IPA; please enter manually";
      }
    } catch (error) {
      newErrors.ipa = "Error fetching IPA; please enter manually";
    }

    setErrors(newErrors);

    // Only block submission if word is missing (IPA is optional)
    return !newErrors.word;
  };

  const handleSubmit = async () => {
    const isValid = await validateAndFetchIPA();
    if (isValid) {
      console.log("Submitting:", { word, ipaUS, ipaUK });
      Alert.alert("Success", "Word added!");
    }
  };

  return (
    <View>
      <TextInput placeholder="Word" value={word} onChangeText={setWord} />
      {errors.word ? <Text style={{ color: "red" }}>{errors.word}</Text> : null}

      <TextInput placeholder="US IPA" value={ipaUS} onChangeText={setIpaUS} />
      <TextInput placeholder="UK IPA" value={ipaUK} onChangeText={setIpaUK} />
      {errors.ipa ? <Text style={{ color: "orange" }}>{errors.ipa}</Text> : null}

      <Button title="Add Word" onPress={handleSubmit} />
    </View>
  );
}

// =============================================================================
// EXAMPLE 6: Cache Management
// =============================================================================

export function Example6_CacheManagement() {
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    clearIpaCache();
    setCacheCleared(true);
    Alert.alert("Cache Cleared", "IPA cache has been cleared");

    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <View>
      <Button title="Clear IPA Cache" onPress={handleClearCache} />
      {cacheCleared && <Text>✓ Cache cleared</Text>}

      <Text style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        Cache stores fetched IPA data for the current session to avoid
        repeated API calls. Clear it if you need fresh data or to free memory.
      </Text>
    </View>
  );
}

// =============================================================================
// EXAMPLE 7: Error Handling Best Practices
// =============================================================================

export async function Example7_RobustFetch(word: string) {
  try {
    // Set a reasonable expectation
    console.log(`Fetching IPA for "${word}"...`);

    const result = await getIpaUSUK(word);

    // Always check the source first
    if (result.source === "wiktionary") {
      // Success case
      const us = result.us || "Not available";
      const uk = result.uk || "Not available";

      console.log(`✓ Found IPA for "${word}"`);
      console.log(`  US: ${us}`);
      console.log(`  UK: ${uk}`);

      return { success: true, us: result.us, uk: result.uk };
    } else {
      // Not found case (not an error!)
      console.log(`ℹ IPA not found for "${word}" on Wiktionary`);

      return {
        success: false,
        us: null,
        uk: null,
        message: "IPA not found; please enter manually",
      };
    }
  } catch (error: any) {
    // Unexpected error case
    console.error(`✗ Unexpected error fetching IPA for "${word}":`, error);

    return {
      success: false,
      us: null,
      uk: null,
      message: "Error fetching IPA; please try again",
    };
  }
}

// =============================================================================
// USAGE NOTES
// =============================================================================

/*

BEST PRACTICES:

1. Always allow manual editing
   - Auto-fetch is a convenience, not a requirement
   - Users should always be able to override

2. Handle missing data gracefully
   - result.source === "none" means IPA wasn't found
   - result.us === null or result.uk === null means that variant is missing
   - Both are normal - not all words have both pronunciations

3. Show appropriate feedback
   - Loading indicator while fetching
   - Success: silently populate fields
   - Failure: show gentle message asking for manual input

4. Don't block user workflow
   - IPA should be optional enhancement
   - Let users continue even if auto-fetch fails

5. Consider network conditions
   - Service has 8s timeout
   - Cache reduces redundant requests
   - Batch import includes delays to be API-friendly

6. Testing
   - Test with common words: "hello", "world"
   - Test with US/UK differences: "color", "schedule"
   - Test with missing data: "xyzabc123"
   - Test with special characters: "naïve", "café"

*/
