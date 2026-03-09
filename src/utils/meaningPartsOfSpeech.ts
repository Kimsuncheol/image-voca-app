export interface MeaningSegment {
  type: "text" | "pos";
  value: string;
}

export interface MeaningLine {
  linePrefix?: string;
  segments: MeaningSegment[];
}

export interface ParsedMeaningPartsOfSpeech {
  lines: MeaningLine[];
  hasPartsOfSpeech: boolean;
}

const LINE_PREFIX_REGEX = /^\s*(\d+\.)\s*/;
const PART_OF_SPEECH_REGEX = /\b(prep|ad|n|v|a)\.(?=\s|$)/gi;

const pushTextSegment = (segments: MeaningSegment[], value: string) => {
  if (!value) {
    return;
  }

  const previous = segments[segments.length - 1];
  if (previous?.type === "text") {
    previous.value += value;
    return;
  }

  segments.push({ type: "text", value });
};

export function parseMeaningPartsOfSpeech(
  meaning: string,
): ParsedMeaningPartsOfSpeech {
  const lines = meaning.split("\n").map((rawLine) => {
    let linePrefix: string | undefined;
    let content = rawLine;

    const prefixMatch = rawLine.match(LINE_PREFIX_REGEX);
    if (prefixMatch) {
      linePrefix = prefixMatch[1];
      content = rawLine.slice(prefixMatch[0].length);
    }

    const segments: MeaningSegment[] = [];
    let lastIndex = 0;

    for (const match of content.matchAll(PART_OF_SPEECH_REGEX)) {
      const matchIndex = match.index ?? 0;
      pushTextSegment(segments, content.slice(lastIndex, matchIndex));
      segments.push({ type: "pos", value: match[1].toLowerCase() });
      lastIndex = matchIndex + match[0].length;
    }

    pushTextSegment(segments, content.slice(lastIndex));

    return {
      linePrefix,
      segments: segments.length > 0 ? segments : [{ type: "text", value: content }],
    };
  });

  return {
    lines,
    hasPartsOfSpeech: lines.some((line) =>
      line.segments.some((segment) => segment.type === "pos"),
    ),
  };
}
