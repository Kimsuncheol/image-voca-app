const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parse } = require("csv-parse/sync");

const DEFAULT_SOURCE_DIR = path.join(os.homedir(), "Downloads");
const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "counters.seed.json",
);

const COUNTER_CSV_FILES = {
  numbers: "JLPT_N5 - COUNTERS＿NUMBERS (1).csv",
  counter_tsuu: "JLPT_N5 - COUNTERS_TSUU (1).csv",
  counter_ko: "JLPT_N5 - COUNTERS_KO (2).csv",
  counter_kai_floor: "JLPT_N5 - COUNTERS_KAI_FLOOR (1).csv",
  counter_kai_times: "JLPT_N5 - COUNTERS_KAI_TIMES (1).csv",
  counter_ban: "JLPT_N5 - COUNTERS_BAN (1).csv",
  counter_ens: "JLPT_N5 - COUNTERS_ENS (1).csv",
  counter_years: "JLPT_N5 - COUNTERS_YEARS (1).csv",
  counter_months: "JLPT_N5 - COUNTERS_MONTHS (1).csv",
  counter_days: "JLPT_N5 - COUNTERS_DAYS (1).csv",
  counter_hours: "JLPT_N5 - COUNTERS_HOURS (1).csv",
  counter_minutes: "JLPT_N5 - COUNTERS_MINUTES (1).csv",
  counter_weekdays: "JLPT_N5 - COUNTERS_WEEKDAYS (1).csv",
  counter_hai: "JLPT_N5 - COUNTERS_HAI (1).csv",
  counter_bai: "JLPT_N5 - COUNTERS_BAI (1).csv",
  counter_hon: "JLPT_N5 - COUNTERS_HON (1).csv",
  counter_mai: "JLPT_N5 - COUNTERS_MAI (1).csv",
  counter_nin: "JLPT_N5 - COUNTERS_NIN (1).csv",
  counter_hiki: "JLPT_N5 - COUNTERS_HIKI (1).csv",
};

const HEADER_ROW = [
  "",
  "word",
  "meaning(English)",
  "meaning(Korean)",
  "pronunciation",
  "example",
  "translation(English)",
  "translation(Korean)",
];

const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
};

const normalizeCell = (value) => String(value ?? "").trim();

const parseCounterCsv = (content, tab) => {
  const rows = parse(content, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: false,
    trim: false,
  });

  const headerRowIndex = rows.findIndex((row) => {
    if (!Array.isArray(row) || row.length < HEADER_ROW.length) {
      return false;
    }

    return HEADER_ROW.every((header, index) => normalizeCell(row[index]) === header);
  });

  if (headerRowIndex === -1) {
    throw new Error(`Could not find the expected counters header row for ${tab}.`);
  }

  return rows
    .slice(headerRowIndex + 1)
    .filter((row) => Array.isArray(row) && row.some((cell) => normalizeCell(cell) !== ""))
    .map((row, index) => {
      const [
        ,
        word,
        meaningEnglish,
        meaningKorean,
        pronunciation,
        example,
        translationEnglish,
        translationKorean,
      ] = row;

      return {
        id: `${tab}-${String(index + 1).padStart(2, "0")}`,
        word: normalizeCell(word),
        meaningEnglish: normalizeCell(meaningEnglish),
        meaningKorean: normalizeCell(meaningKorean),
        pronunciation: normalizeCell(pronunciation),
        pronunciationRoman: "",
        example: normalizeCell(example),
        exampleRoman: "",
        translationEnglish: normalizeCell(translationEnglish),
        translationKorean: normalizeCell(translationKorean),
        category: tab,
      };
    });
};

const buildCountersSeedData = (
  sourceDir = DEFAULT_SOURCE_DIR,
  fileMap = COUNTER_CSV_FILES,
) => {
  return Object.fromEntries(
    Object.entries(fileMap).map(([tab, filename]) => {
      const fullPath = path.join(sourceDir, filename);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Missing counters CSV for ${tab}: ${fullPath}`);
      }

      const content = fs.readFileSync(fullPath, "utf8");
      return [tab, parseCounterCsv(content, tab)];
    }),
  );
};

const writeCountersSeedFile = (
  outputPath = DEFAULT_OUTPUT_PATH,
  sourceDir = DEFAULT_SOURCE_DIR,
) => {
  const data = buildCountersSeedData(sourceDir);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return data;
};

if (require.main === module) {
  const sourceDir = getArgValue("--source-dir") || DEFAULT_SOURCE_DIR;
  const outputPath = getArgValue("--output") || DEFAULT_OUTPUT_PATH;
  const data = writeCountersSeedFile(outputPath, sourceDir);
  const totalRows = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);

  console.log(
    `Wrote ${Object.keys(data).length} counter categories (${totalRows} rows) to ${outputPath}`,
  );
}

module.exports = {
  COUNTER_CSV_FILES,
  DEFAULT_OUTPUT_PATH,
  DEFAULT_SOURCE_DIR,
  buildCountersSeedData,
  parseCounterCsv,
  writeCountersSeedFile,
};
