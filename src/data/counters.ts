import seedData from "../../assets/data/counters.seed.json";
import type { CounterTabId, CounterWord } from "../types/counters";

export type CountersSeedData = Record<CounterTabId, CounterWord[]>;

export const COUNTERS_DATA = seedData as CountersSeedData;
