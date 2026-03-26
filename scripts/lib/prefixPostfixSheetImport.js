function normalizeHeaderKey(key) {
  return String(key ?? "").trim().toLowerCase();
}

function normalizeCellValue(value) {
  return String(value ?? "").trim();
}

function normalizeSheetRow(row) {
  return Object.entries(row ?? {}).reduce((acc, [key, value]) => {
    acc[normalizeHeaderKey(key)] = normalizeCellValue(value);
    return acc;
  }, {});
}

function createStableId(kind, index, row) {
  const providedId = normalizeCellValue(row.id);
  if (providedId) return providedId;

  return `${kind}-${String(index + 1).padStart(3, "0")}`;
}

function mapPrefixRows(rows) {
  return rows.map((rawRow, index) => {
    const row = normalizeSheetRow(rawRow);

    return {
      id: createStableId("prefix", index, row),
      prefix: row["prefix"] ?? "",
      meaningEnglish: row["meaning(english)"] ?? "",
      meaningKorean: row["meaning(korean)"] ?? "",
      pronunciation: row["pronunciation"] ?? "",
      pronunciationRoman: row["pronunciation(roman)"] ?? "",
      example: row["example"] ?? "",
      exampleRoman: row["example(roman)"] ?? "",
      translationEnglish: row["translation(english)"] ?? "",
      translationKorean: row["translation(korean)"] ?? "",
    };
  });
}

function mapPostfixRows(rows) {
  return rows.map((rawRow, index) => {
    const row = normalizeSheetRow(rawRow);

    return {
      id: createStableId("postfix", index, row),
      postfix: row["postfix"] ?? "",
      meaningEnglish: row["meaning(english)"] ?? "",
      meaningKorean: row["meaning(korean)"] ?? "",
      pronunciation: row["pronunciation"] ?? "",
      pronunciationRoman: row["pronunciation(roman)"] ?? "",
      example: row["example"] ?? "",
      exampleRoman: row["example(roman)"] ?? "",
      translationEnglish: row["translation(english)"] ?? "",
      translationKorean: row["translation(korean)"] ?? "",
    };
  });
}

function normalizeFirestoreCollectionPath(path) {
  return String(path ?? "").trim().replace(/^\/+|\/+$/g, "");
}

function isValidFirestoreCollectionPath(path) {
  const normalized = normalizeFirestoreCollectionPath(path);
  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 && segments.length % 2 === 1;
}

module.exports = {
  isValidFirestoreCollectionPath,
  mapPostfixRows,
  mapPrefixRows,
  normalizeFirestoreCollectionPath,
};
