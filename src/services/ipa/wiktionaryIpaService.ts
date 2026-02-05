/**
 * =============================================================================
 * WIKTIONARY IPA SERVICE
 * =============================================================================
 * Fetches and parses IPA pronunciations (US and UK) from Wiktionary MediaWiki API.
 *
 * FEATURES:
 * - Fetches wikitext from Wiktionary API
 * - Parses pronunciation sections to extract IPA
 * - Differentiates between US (General American) and UK (RP) pronunciations
 * - In-memory caching for current session
 * - Timeout handling (8 seconds default)
 * - Graceful error handling
 *
 * USAGE:
 * ```typescript
 * const result = await getIpaUSUK("hello");
 * // { us: "/ˈhɛloʊ/", uk: "/həˈləʊ/", source: "wiktionary" }
 * ```
 * =============================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export interface IpaResult {
  us: string | null;
  uk: string | null;
  source: "wiktionary" | "none";
}

interface WikitextResponse {
  parse?: {
    title: string;
    pageid: number;
    wikitext: string;
  };
  error?: {
    code: string;
    info: string;
  };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const WIKTIONARY_API_URL = "https://en.wiktionary.org/w/api.php";
const REQUEST_TIMEOUT = 8000; // 8 seconds
const CACHE_MAX_SIZE = 500; // Limit cache to prevent memory issues

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

const cache = new Map<string, IpaResult>();

/**
 * Get cached result for a word
 */
function getCached(word: string): IpaResult | undefined {
  return cache.get(word.toLowerCase().trim());
}

/**
 * Store result in cache with size limit
 */
function setCached(word: string, result: IpaResult): void {
  const key = word.toLowerCase().trim();

  // Simple LRU: if cache is full, remove oldest entry
  if (cache.size >= CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, result);
}

/**
 * Clear the entire cache (useful for testing or memory management)
 */
export function clearIpaCache(): void {
  cache.clear();
}

// =============================================================================
// API FETCHING
// =============================================================================

/**
 * Fetch wikitext from Wiktionary with timeout
 */
async function fetchWikitext(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = new URL(WIKTIONARY_API_URL);
    url.searchParams.set("action", "parse");
    url.searchParams.set("page", word);
    url.searchParams.set("prop", "wikitext");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatversion", "2");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Wiktionary] HTTP ${response.status} for "${word}"`);
      return null;
    }

    const data: WikitextResponse = await response.json();

    if (data.error) {
      console.warn(`[Wiktionary] API error for "${word}":`, data.error.info);
      return null;
    }

    if (!data.parse?.wikitext) {
      console.warn(`[Wiktionary] No wikitext found for "${word}"`);
      return null;
    }

    return data.parse.wikitext;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.warn(`[Wiktionary] Timeout fetching "${word}"`);
    } else {
      console.warn(`[Wiktionary] Fetch error for "${word}":`, error.message);
    }

    return null;
  }
}

// =============================================================================
// WIKITEXT PARSING
// =============================================================================

/**
 * Extract pronunciation section from wikitext
 * Looks for ===Pronunciation=== or similar headers
 */
function extractPronunciationSection(wikitext: string): string | null {
  // Match pronunciation section (case-insensitive)
  const match = wikitext.match(
    /===\s*Pronunciation\s*===\s*([\s\S]*?)(?=\n===|\n==|$)/i
  );

  return match ? match[1] : null;
}

/**
 * Parse IPA from pronunciation section
 * Handles various Wiktionary templates and formats
 */
function parseIpaFromSection(section: string): { us: string | null; uk: string | null } {
  let usIpa: string | null = null;
  let ukIpa: string | null = null;

  // Split into lines for easier processing
  const lines = section.split("\n");

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Determine if this line is for US or UK
    const isUS = /\{\{a\|(?:US|GA|General American|GenAm)\}\}|'''US'''|'''GenAm'''|\(US\)|\(GA\)/i.test(line);
    const isUK = /\{\{a\|(?:UK|RP|Received Pronunciation|British)\}\}|'''UK'''|'''RP'''|'''British'''|\(UK\)|\(RP\)|\(British\)/i.test(line);

    // Extract IPA using various patterns
    // Pattern 1: {{IPA|en|/...*/}}
    let ipaMatch = line.match(/\{\{IPA\|en\|(\/[^}\/]+\/)\}\}/);

    // Pattern 2: IPA: /...*/
    if (!ipaMatch) {
      ipaMatch = line.match(/IPA:\s*(\/[^,\n]+\/)/);
    }

    // Pattern 3: Just IPA in slashes after accent marker
    if (!ipaMatch) {
      ipaMatch = line.match(/(\/[ˈˌəɪʊɛæɑɔʌaeiouɜːˑθðʃʒŋtsdnlrwjhkɡpbfvmz]+\/)/i);
    }

    if (ipaMatch) {
      const ipa = ipaMatch[1];

      if (isUS && !usIpa) {
        usIpa = ipa;
      } else if (isUK && !ukIpa) {
        ukIpa = ipa;
      } else if (!isUS && !isUK) {
        // If no explicit marker, try to guess or use as fallback
        // First IPA found without marker could be general/US
        if (!usIpa) {
          usIpa = ipa;
        } else if (!ukIpa) {
          ukIpa = ipa;
        }
      }
    }

    // Stop if we found both
    if (usIpa && ukIpa) break;
  }

  return { us: usIpa, uk: ukIpa };
}

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Get US and UK IPA pronunciations for a word from Wiktionary
 *
 * @param word - The English word to lookup
 * @returns Promise resolving to IpaResult with US/UK pronunciations
 *
 * @example
 * ```typescript
 * const result = await getIpaUSUK("hello");
 * if (result.source === "wiktionary") {
 *   console.log("US:", result.us);  // "/ˈhɛloʊ/"
 *   console.log("UK:", result.uk);  // "/həˈləʊ/"
 * }
 * ```
 */
export async function getIpaUSUK(word: string): Promise<IpaResult> {
  // Normalize input
  const normalized = word.trim().toLowerCase();

  if (!normalized) {
    return { us: null, uk: null, source: "none" };
  }

  // Check cache first
  const cached = getCached(normalized);
  if (cached) {
    console.log(`[Wiktionary] Cache hit for "${normalized}"`);
    return cached;
  }

  // Fetch wikitext
  const wikitext = await fetchWikitext(normalized);
  if (!wikitext) {
    const result: IpaResult = { us: null, uk: null, source: "none" };
    setCached(normalized, result);
    return result;
  }

  // Extract pronunciation section
  const pronunciationSection = extractPronunciationSection(wikitext);
  if (!pronunciationSection) {
    console.log(`[Wiktionary] No pronunciation section for "${normalized}"`);
    const result: IpaResult = { us: null, uk: null, source: "none" };
    setCached(normalized, result);
    return result;
  }

  // Parse IPA
  const { us, uk } = parseIpaFromSection(pronunciationSection);

  const result: IpaResult = {
    us,
    uk,
    source: us || uk ? "wiktionary" : "none",
  };

  // Cache result
  setCached(normalized, result);

  console.log(`[Wiktionary] Parsed "${normalized}":`, result);
  return result;
}

/**
 * Batch fetch IPA for multiple words
 * Useful for importing multiple words at once
 *
 * @param words - Array of words to lookup
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to Map of word -> IpaResult
 */
export async function batchGetIpaUSUK(
  words: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, IpaResult>> {
  const results = new Map<string, IpaResult>();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const result = await getIpaUSUK(word);
    results.set(word, result);

    if (onProgress) {
      onProgress(i + 1, words.length);
    }

    // Add small delay to avoid overwhelming the API
    if (i < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
