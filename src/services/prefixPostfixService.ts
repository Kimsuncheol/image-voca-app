import type { PostfixWord, PrefixWord } from "../types/prefixPostfix";
import { SEED_POSTFIXES, SEED_PREFIXES } from "../data/prefixPostfixSeed";

export type PrefixPostfixData = {
  postfixes: PostfixWord[];
  prefixes: PrefixWord[];
};

export const getPrefixPostfixData = async (): Promise<PrefixPostfixData> => {
  return {
    prefixes: SEED_PREFIXES,
    postfixes: SEED_POSTFIXES,
  };
};
