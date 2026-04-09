import { getDocs } from "firebase/firestore";
import { COUNTERS_DATA } from "../../src/data/counters";
import { getCountersData } from "../../src/services/countersService";

jest.mock("firebase/firestore", () => ({
  getDocs: jest.fn(),
}));

describe("countersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns bundled local data for each tab without calling Firestore", async () => {
    const result = await getCountersData("numbers");

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual(expect.objectContaining({
      id: "numbers-01",
      word: "一",
      meaningEnglish: "one",
      meaningKorean: "하나",
      pronunciation: "いち",
      pronunciationRoman: "",
      exampleRoman: "",
      translationEnglish: "One year is twelve months.",
      translationKorean: "일 년은 12개월입니다.",
      category: "numbers",
    }));
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("returns sorted local data", async () => {
    const result = await getCountersData("counter_tsuu");

    expect(result.map((item) => item.id)).toEqual(
      [...result.map((item) => item.id)].sort((a, b) => a.localeCompare(b)),
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("contains bundled local data for every counter tab", async () => {
    const tabs = Object.keys(COUNTERS_DATA);

    expect(tabs).toEqual(expect.arrayContaining([
      "numbers",
      "counter_tsuu",
      "counter_ko",
      "counter_kai_floor",
      "counter_kai_times",
      "counter_ban",
      "counter_ens",
      "counter_years",
      "counter_months",
      "counter_days",
      "counter_hours",
      "counter_minutes",
      "counter_weekdays",
      "counter_hai",
      "counter_bai",
      "counter_hon",
      "counter_mai",
      "counter_nin",
      "counter_hiki",
    ]));
  });

  it("returns an empty array instead of throwing when a tab has no local rows", async () => {
    const original = COUNTERS_DATA.counter_hiki;
    COUNTERS_DATA.counter_hiki = [];

    await expect(getCountersData("counter_hiki")).resolves.toEqual([]);

    COUNTERS_DATA.counter_hiki = original;
  });
});
