const normalizeTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const isPronunciationMatchEligible = (
  word?: string,
  pronunciation?: string,
) => {
  const normalizedWord = normalizeTrimmedString(word);
  const normalizedPronunciation = normalizeTrimmedString(pronunciation);

  return (
    !!normalizedPronunciation &&
    (!!normalizedWord ? normalizedPronunciation !== normalizedWord : true)
  );
};
