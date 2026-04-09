const {
  buildCountersSeedData,
  parseCounterCsv,
} = require("../../scripts/import_counters");

describe("import_counters", () => {
  it("skips the blank first row and blank first column when parsing a counter CSV", () => {
    const csv = [
      ",,,,,,,",
      ",word,meaning(English),meaning(Korean),pronunciation,example,translation(English),translation(Korean)",
      ",一,one,하나,いち,一(いち)年(ねん)です。,It is one year.,일 년입니다.",
      ",二,two,둘,に,二(に)人(にん)です。,There are two people.,두 명입니다.",
    ].join("\n");

    const result = parseCounterCsv(csv, "numbers");

    expect(result).toEqual([
      expect.objectContaining({
        id: "numbers-01",
        word: "一",
        meaningEnglish: "one",
        meaningKorean: "하나",
        pronunciation: "いち",
        example: "一(いち)年(ねん)です。",
        translationEnglish: "It is one year.",
        translationKorean: "일 년입니다.",
        pronunciationRoman: "",
        exampleRoman: "",
        category: "numbers",
      }),
      expect.objectContaining({
        id: "numbers-02",
        word: "二",
      }),
    ]);
  });

  it("builds representative tab counts from fixture-style CSV files", () => {
    const fs = require("node:fs");
    const os = require("node:os");
    const path = require("node:path");

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "counters-seed-"));

    const writeCsv = (filename, rows) => {
      fs.writeFileSync(tmpDir + path.sep + filename, rows.join("\n"), "utf8");
    };

    writeCsv("numbers.csv", [
      ",,,,,,,",
      ",word,meaning(English),meaning(Korean),pronunciation,example,translation(English),translation(Korean)",
      ",一,one,하나,いち,例1,example 1,예문 1",
      ",二,two,둘,に,例2,example 2,예문 2",
    ]);
    writeCsv("days.csv", [
      ",,,,,,,",
      ",word,meaning(English),meaning(Korean),pronunciation,example,translation(English),translation(Korean)",
      ",一日,one day,하루,ついたち,例1,example 1,예문 1",
      ",二日,two days,이틀,ふつか,例2,example 2,예문 2",
      ",三日,three days,사흘,みっか,例3,example 3,예문 3",
    ]);
    writeCsv("weekdays.csv", [
      ",,,,,,,",
      ",word,meaning(English),meaning(Korean),pronunciation,example,translation(English),translation(Korean)",
      ",月曜日,Monday,월요일,げつようび,例1,example 1,예문 1",
    ]);

    const result = buildCountersSeedData(tmpDir, {
      numbers: "numbers.csv",
      counter_days: "days.csv",
      counter_weekdays: "weekdays.csv",
    });

    expect(result.numbers).toHaveLength(2);
    expect(result.counter_days).toHaveLength(3);
    expect(result.counter_weekdays).toHaveLength(1);
  });
});
