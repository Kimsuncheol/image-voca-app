import seedData from "../../assets/data/prefixPostfix.seed.json";
import type { PostfixWord, PrefixWord } from "../types/prefixPostfix";

type PrefixPostfixSeedData = {
  prefixes: PrefixWord[];
  postfixes: PostfixWord[];
};

const { prefixes, postfixes } = seedData as PrefixPostfixSeedData;

export const PREFIXES: PrefixWord[] = prefixes;
export const POSTFIXES: PostfixWord[] = postfixes;
