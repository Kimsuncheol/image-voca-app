import { FirebaseError } from "firebase/app";
import { collection, getDocs } from "firebase/firestore";
import {
  fetchPrefixPostfixDataFromFirestore,
  getPrefixPostfixData,
} from "../../src/services/prefixPostfixService";

const mockSetFirebaseOnline = jest.fn();
const mockSetFirebaseOffline = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

jest.mock("../../src/stores/networkStore", () => ({
  useNetworkStore: {
    getState: () => ({
      setFirebaseOnline: mockSetFirebaseOnline,
      setFirebaseOffline: mockSetFirebaseOffline,
    }),
  },
}));

const buildSnapshot = (docs: Array<{ data: () => Record<string, unknown>; id: string }>) => ({
  docs,
  empty: docs.length === 0,
});

describe("prefixPostfixService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX = "/reference/jlpt/prefix";
    process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_POSTFIX = "/reference/jlpt/postfix";
    (collection as jest.Mock).mockImplementation(
      (_db, path: string) => ({
        path,
      }),
    );
  });

  it("maps Firestore prefix and postfix documents into the existing app shape", async () => {
    (getDocs as jest.Mock).mockImplementation(
      async ({ path }: { path: string }) =>
        path.endsWith("/prefix")
          ? buildSnapshot([
              {
                id: "prefix-02",
                data: () => ({
                  example: "無料",
                  exampleRoman: "muryō",
                  meaningEnglish: "absence / lack",
                  meaningKorean: "없음·무",
                  prefix: "無-",
                  pronunciation: "む",
                  pronunciationRoman: "mu",
                  translationEnglish: "free of charge",
                  translationKorean: "무료",
                }),
              },
            ])
          : buildSnapshot([
              {
                id: "postfix-03",
                data: () => ({
                  example: "1. 安全性\n2. 利便性",
                  exampleRoman: "1. anzensei\n2. ribensei",
                  meaningEnglish: "nature / property / -ness",
                  meaningKorean: "~성, 성질",
                  postfix: "-性",
                  pronunciation: "〜せい",
                  pronunciationRoman: "-sei",
                  translationEnglish: "1. safety\n2. convenience",
                  translationKorean: "1. 안전성\n2. 편리성",
                }),
              },
            ]),
    );

    const result = await fetchPrefixPostfixDataFromFirestore();

    expect(result.prefixes).toEqual([
      expect.objectContaining({
        id: "prefix-02",
        prefix: "無-",
        translationEnglish: "free of charge",
      }),
    ]);
    expect(result.postfixes).toEqual([
      expect.objectContaining({
        id: "postfix-03",
        postfix: "-性",
        translationKorean: "1. 안전성\n2. 편리성",
      }),
    ]);
  });

  it("returns remote data and marks Firebase online when both subcollections are populated", async () => {
    (getDocs as jest.Mock).mockImplementation(
      async ({ path }: { path: string }) =>
        path.endsWith("/prefix")
          ? buildSnapshot([
              {
                id: "prefix-01",
                data: () => ({
                  example: "1. お名前\n2. ご案内",
                  exampleRoman: "1. onamae\n2. goannai",
                  meaningEnglish: "polite / honorific",
                  meaningKorean: "공손·존칭",
                  prefix: "お-/ご-",
                  pronunciation: "1. お\n2. ご",
                  pronunciationRoman: "1. o\n2. go",
                  translationEnglish: "1. name\n2. guidance",
                  translationKorean: "1. 이름\n2. 안내",
                }),
              },
            ])
          : buildSnapshot([
              {
                id: "postfix-01",
                data: () => ({
                  example: "1. 会員\n2. 社員",
                  exampleRoman: "1. kaiin\n2. shain",
                  meaningEnglish: "-al / -like",
                  meaningKorean: "~적, ~다운",
                  postfix: "~員",
                  pronunciation: "〜いん",
                  pronunciationRoman: "-in",
                  translationEnglish: "1. member\n2. employee or company staff",
                  translationKorean: "1. 회원\n2. 사원",
                }),
              },
            ]),
    );

    const result = await getPrefixPostfixData();

    expect(result.prefixes[0].prefix).toBe("お-/ご-");
    expect(result.postfixes[0].postfix).toBe("~員");
    expect(mockSetFirebaseOnline).toHaveBeenCalled();
    expect(mockSetFirebaseOffline).not.toHaveBeenCalled();
  });

  it("throws when the prefix Firestore path is missing", async () => {
    delete process.env.EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX;

    await expect(getPrefixPostfixData()).rejects.toThrow(
      "Missing or invalid EXPO_PUBLIC_COURSE_PATH_JLPT_PREFIX",
    );
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("returns empty arrays when Firestore returns an empty subcollection", async () => {
    (getDocs as jest.Mock).mockImplementation(
      async ({ path }: { path: string }) =>
        path.endsWith("/prefix")
          ? buildSnapshot([])
          : buildSnapshot([
              {
                id: "postfix-01",
                data: () => ({
                  example: "1. 会員\n2. 社員",
                  exampleRoman: "1. kaiin\n2. shain",
                  meaningEnglish: "a person who belongs to or works in a group or organization",
                  meaningKorean: "~원",
                  postfix: "~員",
                  pronunciation: "〜いん",
                  pronunciationRoman: "-in",
                  translationEnglish: "1. member\n2. employee or company staff",
                  translationKorean: "1. 회원\n2. 사원",
                }),
              },
            ]),
    );

    await expect(getPrefixPostfixData()).resolves.toEqual({
      postfixes: [
        expect.objectContaining({
          id: "postfix-01",
          postfix: "~員",
        }),
      ],
      prefixes: [],
    });
  });

  it("throws when Firestore read fails", async () => {
    (getDocs as jest.Mock).mockRejectedValue(
      new FirebaseError("unavailable", "Firestore unavailable"),
    );

    await expect(getPrefixPostfixData()).rejects.toMatchObject({
      code: "unavailable",
    });
    expect(mockSetFirebaseOffline).toHaveBeenCalledWith(true);
  });
});
