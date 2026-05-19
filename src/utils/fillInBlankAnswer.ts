const normalizeAnswer = (value: string) => value.trim();

const normalizeComparableAnswer = (value: string, language?: string) => {
  const normalized = normalizeAnswer(value);
  return language?.toLowerCase().startsWith("ja")
    ? normalized
    : normalized.toLocaleLowerCase();
};

export const isFillInBlankAnswerCorrect = ({
  answer,
  correctAnswer,
  correctForms = [],
  language,
}: {
  answer: string;
  correctAnswer: string;
  correctForms?: string[];
  language?: string;
}) => {
  const normalizedAnswer = normalizeComparableAnswer(answer, language);
  if (!normalizedAnswer) return false;

  return [correctAnswer, ...correctForms].some(
    (candidate) =>
      normalizeComparableAnswer(candidate, language) === normalizedAnswer,
  );
};
