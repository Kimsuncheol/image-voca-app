export interface RoleplaySegment {
  type: "role" | "text";
  content: string;
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
