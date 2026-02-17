export interface RoleplaySegment {
  type: "role" | "text";
  content: string;
}

export interface DialogueTurn {
  role: string | null;
  text: string;
}

export function parseRoleplaySegments(text: string): RoleplaySegment[] | null {
  if (!text) return null;

  const segments: RoleplaySegment[] = [];
  const regex = /([.?!]|^)\s*([^.?!:\n]+)(:)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatchStart = match.index;
    const delimiter = match[1];
    const roleName = match[2].trim();

    const preTextEnd = fullMatchStart + delimiter.length;
    if (preTextEnd > lastIndex) {
      const textSegment = text.substring(lastIndex, preTextEnd).trim();
      if (textSegment) {
        segments.push({ type: "text", content: textSegment });
      }
    }

    segments.push({ type: "role", content: roleName });
    lastIndex = fullMatchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText) {
      segments.push({ type: "text", content: remainingText });
    }
  }

  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}

export function toDialogueTurns(text: string): DialogueTurn[] {
  const segments = parseRoleplaySegments(text) || [];
  if (!segments.length) return [];

  const turns: DialogueTurn[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    if (segment.type === "role") {
      const next = segments[i + 1];
      const textContent =
        next && next.type === "text" ? next.content.trim() : "";

      if (textContent) {
        turns.push({ role: segment.content, text: textContent });
      }

      if (next && next.type === "text") {
        i += 1;
      }
      continue;
    }

    const textContent = segment.content.trim();
    if (textContent) {
      turns.push({ role: null, text: textContent });
    }
  }

  return turns;
}

export function stripRoleLabels(text: string): string {
  if (!text?.trim()) return "";
  const turns = toDialogueTurns(text);
  if (!turns.length) return "";
  return turns.map((turn) => turn.text).join("\n");
}
