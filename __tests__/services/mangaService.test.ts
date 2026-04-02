import { collection, getDocs } from "firebase/firestore";
import { fetchMangaDayPages } from "../../src/services/mangaService";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

describe("mangaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockImplementation((_db, ...segments: string[]) => ({
      path: segments.join("/"),
    }));
  });

  it("fetches JLPT manga pages from the level-based items path", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "page-2",
          data: () => ({
            uploadIndex: 2,
            imageUrl: "https://cdn.example.com/jlpt-n3-day4-2.png",
          }),
        },
        {
          id: "page-1",
          data: () => ({
            uploadIndex: 1,
            imageUrl: "https://cdn.example.com/jlpt-n3-day4-1.png",
          }),
        },
      ],
    });

    const result = await fetchMangaDayPages("JLPT_N3", "4");

    expect(collection).toHaveBeenCalledWith(
      {},
      "manga",
      "JLPT",
      "levels",
      "N3",
      "days",
      "Day4",
      "items",
    );
    expect(result).toEqual([
      "https://cdn.example.com/jlpt-n3-day4-1.png",
      "https://cdn.example.com/jlpt-n3-day4-2.png",
    ]);
  });

  it("maps JLPT_N5 to N5 for the manga level path", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "page-1",
          data: () => ({
            uploadIndex: 1,
            imageUrl: "https://cdn.example.com/jlpt-n5-day1-1.png",
          }),
        },
      ],
    });

    const result = await fetchMangaDayPages("JLPT_N5", "1");

    expect(collection).toHaveBeenCalledWith(
      {},
      "manga",
      "JLPT",
      "levels",
      "N5",
      "days",
      "Day1",
      "items",
    );
    expect(result).toEqual(["https://cdn.example.com/jlpt-n5-day1-1.png"]);
  });

  it("fetches standard-course manga pages from the course items path", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "page-1",
          data: () => ({
            uploadIndex: 1,
            imageUrl: "https://cdn.example.com/toeic-day7-1.png",
          }),
        },
      ],
    });

    const result = await fetchMangaDayPages("TOEIC", "7");

    expect(collection).toHaveBeenCalledWith(
      {},
      "manga",
      "TOEIC",
      "days",
      "Day7",
      "items",
    );
    expect(result).toEqual(["https://cdn.example.com/toeic-day7-1.png"]);
  });

  it("fetches collocation manga pages from the course items path", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "page-1",
          data: () => ({
            uploadIndex: 1,
            imageUrl: "https://cdn.example.com/collocation-day2-1.png",
          }),
        },
      ],
    });

    const result = await fetchMangaDayPages("COLLOCATION", "2");

    expect(collection).toHaveBeenCalledWith(
      {},
      "manga",
      "COLLOCATION",
      "days",
      "Day2",
      "items",
    );
    expect(result).toEqual(["https://cdn.example.com/collocation-day2-1.png"]);
  });

  it("ignores items with missing imageUrl and sorts by uploadIndex", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: "page-3",
          data: () => ({
            uploadIndex: 3,
            imageUrl: "https://cdn.example.com/day5-3.png",
          }),
        },
        {
          id: "page-2",
          data: () => ({
            uploadIndex: 2,
            imageUrl: "   ",
          }),
        },
        {
          id: "page-1",
          data: () => ({
            uploadIndex: 1,
            imageUrl: "https://cdn.example.com/day5-1.png",
          }),
        },
      ],
    });

    await expect(fetchMangaDayPages("TOEFL_IELTS", "5")).resolves.toEqual([
      "https://cdn.example.com/day5-1.png",
      "https://cdn.example.com/day5-3.png",
    ]);
  });

  it("returns an empty array when the items collection is empty", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [],
    });

    await expect(fetchMangaDayPages("TOEFL_IELTS", "3")).resolves.toEqual([]);
  });
});
