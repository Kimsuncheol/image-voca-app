import { useStudyMode } from "./useStudyMode";

export function useAndroidImmersiveStudyMode(keepAwakeTag: string): void {
  useStudyMode(keepAwakeTag);
}
