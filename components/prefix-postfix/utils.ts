export type NumberedLine = {
  index: string;
  value: string;
};

const NUMBERED_LINE_REGEX = /^(\d+)\.\s*(.*)$/;

export const parseNumberedLines = (value: string): NumberedLine[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(NUMBERED_LINE_REGEX);
      if (!match) return null;

      return {
        index: match[1],
        value: match[2],
      };
    })
    .filter((line): line is NumberedLine => line !== null);

export const buildGroupedLines = (...values: string[]) => {
  const parsedGroups = values.map(parseNumberedLines);

  if (parsedGroups.some((group) => group.length === 0)) {
    return null;
  }

  const expectedIndexes = parsedGroups[0].map((line) => line.index);
  const hasMatchingIndexes = parsedGroups.every(
    (group) =>
      group.length === expectedIndexes.length &&
      group.every((line, index) => line.index === expectedIndexes[index]),
  );

  if (!hasMatchingIndexes) {
    return null;
  }

  return expectedIndexes.map((index, groupIndex) =>
    parsedGroups.map((group) => `${index}. ${group[groupIndex].value}`),
  );
};
