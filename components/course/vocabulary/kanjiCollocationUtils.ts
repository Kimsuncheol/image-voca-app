import type { KanjiNestedListGroup } from "../../../src/types/vocabulary";

export const compactStrings = (values?: string[]) =>
  values?.map((v) => v.trim()).filter(Boolean) ?? [];

export const trimmedStringAt = (values: string[], index: number) => {
  const trimmed = values[index]?.trim();
  return trimmed ? trimmed : undefined;
};

export const itemsAt = (groups: KanjiNestedListGroup[], index: number) =>
  compactStrings(groups[index]?.items);
