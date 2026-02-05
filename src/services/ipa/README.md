# Wiktionary IPA Auto-Fetch Service

Automatically fetch US and UK IPA pronunciations from Wiktionary for your vocabulary app.

## 🎯 Quick Start

### 1. Use the Component (Easiest)

```tsx
import { IpaInputField } from "../../src/components/admin/IpaInputField";

<IpaInputField
  word={word}
  ipaUS={ipaUS}
  ipaUK={ipaUK}
  onChangeIpaUS={setIpaUS}
  onChangeIpaUK={setIpaUK}
  isDark={isDark}
  autoFetch={true}
/>
```

### 2. Use the Service Directly

```tsx
import { getIpaUSUK } from "../../src/services/ipa/wiktionaryIpaService";

const ipa = await getIpaUSUK("hello");
// { us: "/ˈhɛloʊ/", uk: "/həˈləʊ/", source: "wiktionary" }
```

## 📁 Files Included

| File | Description |
|------|-------------|
| `wiktionaryIpaService.ts` | Core service with API calls and parsing |
| `IpaInputField.tsx` | Ready-to-use UI component |
| `INTEGRATION_GUIDE.md` | Detailed integration instructions |
| `exampleUsage.tsx` | 7 copy-paste examples |
| `README.md` | This file |

## 🔧 Features

✅ Fetches from free Wiktionary API (no key needed)
✅ Parses US (General American) and UK (RP) pronunciations
✅ In-memory caching (500 entries max)
✅ 8-second timeout with graceful fallback
✅ Handles errors without crashing
✅ Batch import support with progress tracking
✅ Auto-debouncing in UI component (500ms)
✅ Manual editing always allowed
✅ Theme-aware styling (dark/light mode)

## 📚 API Reference

### `getIpaUSUK(word: string): Promise<IpaResult>`

Fetch IPA pronunciations for a single word.

**Returns:**
```typescript
{
  us: string | null;      // US pronunciation or null
  uk: string | null;      // UK pronunciation or null
  source: "wiktionary" | "none";  // Where data came from
}
```

**Example:**
```tsx
const result = await getIpaUSUK("schedule");
// { us: "/ˈskɛdʒuːl/", uk: "/ˈʃɛdjuːl/", source: "wiktionary" }
```

### `batchGetIpaUSUK(words: string[], onProgress?): Promise<Map<string, IpaResult>>`

Fetch IPA for multiple words with progress tracking.

**Example:**
```tsx
const results = await batchGetIpaUSUK(
  ["hello", "world", "computer"],
  (completed, total) => console.log(`${completed}/${total}`)
);
```

### `clearIpaCache(): void`

Clear the in-memory cache.

## 🎨 Component Props

### `IpaInputField`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `word` | `string` | ✅ | Word to fetch IPA for |
| `ipaUS` | `string` | ✅ | Current US IPA value |
| `ipaUK` | `string` | ✅ | Current UK IPA value |
| `onChangeIpaUS` | `(value: string) => void` | ✅ | Callback when US IPA changes |
| `onChangeIpaUK` | `(value: string) => void` | ✅ | Callback when UK IPA changes |
| `isDark` | `boolean` | ❌ | Dark mode (default: false) |
| `autoFetch` | `boolean` | ❌ | Enable auto-fetch (default: true) |

## 🔍 How It Works

1. **Fetch**: Calls Wiktionary MediaWiki API for the word
2. **Parse**: Extracts pronunciation section from wikitext
3. **Differentiate**: Identifies US vs UK using labels like "GA", "RP"
4. **Extract**: Parses IPA from templates like `{{IPA|en|/.../}}`
5. **Cache**: Stores result in memory for session
6. **Return**: Provides both pronunciations or null if not found

## ⚠️ Important Notes

- **Best-effort parsing**: Not perfect, but handles most common words
- **Manual fallback**: Always allow users to edit/enter manually
- **Optional field**: Don't make IPA required for word submission
- **Network required**: No offline support
- **English only**: Currently only supports English Wiktionary
- **Respects API**: Includes delays in batch imports

## 🧪 Testing Suggestions

```tsx
// Common words (should work well)
await getIpaUSUK("hello");
await getIpaUSUK("computer");

// US/UK differences (interesting results)
await getIpaUSUK("schedule");  // Very different!
await getIpaUSUK("aluminum");  // vs "aluminium"

// Edge cases
await getIpaUSUK("worcestershire");  // Complex word
await getIpaUSUK("café");            // Accent marks
await getIpaUSUK("xyzabc123");       // Should return null gracefully
```

## 📖 Documentation

- **Full Guide**: See [`INTEGRATION_GUIDE.md`](./INTEGRATION_GUIDE.md)
- **Examples**: See [`exampleUsage.tsx`](./exampleUsage.tsx)
- **Source Code**: Well-commented in [`wiktionaryIpaService.ts`](./wiktionaryIpaService.ts)

## 🤝 Contributing

To improve IPA parsing:
1. Test with problematic words
2. Log the raw wikitext: `console.log(wikitext)`
3. Update regex patterns in `parseIpaFromSection()`
4. Test thoroughly before deploying

## 📝 License Notes

- **Wiktionary API**: Free, no key required
- **Wiktionary Content**: CC BY-SA 3.0
- **Recommendation**: Add attribution like "Pronunciations from Wiktionary"

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| IPA not found | Normal - allow manual entry |
| Timeout errors | Check network, increase timeout constant |
| Wrong IPA | Update parsing patterns, report word |
| Memory issues | Call `clearIpaCache()` or reduce `CACHE_MAX_SIZE` |
| Display issues | Ensure proper fonts for IPA symbols |

## 📞 Support

1. Check inline code comments
2. Review example files
3. Test with console logging enabled
4. Open issue with problematic words

---

**Ready to use!** Start with `IpaInputField` component for fastest integration.
