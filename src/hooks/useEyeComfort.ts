import { useEffect } from "react";
import { useEyeComfortStore } from "../stores/eyeComfortStore";

export function useEyeComfort() {
  const level = useEyeComfortStore((state) => state.level);
  const customIntensity = useEyeComfortStore(
    (state) => state.customIntensity,
  );
  const isEnabled = useEyeComfortStore((state) => state.isEnabled);
  const isInitialized = useEyeComfortStore((state) => state._initialized);
  const setLevel = useEyeComfortStore((state) => state.setLevel);
  const setCustomIntensity = useEyeComfortStore(
    (state) => state.setCustomIntensity,
  );
  const toggle = useEyeComfortStore((state) => state.toggle);
  const enable = useEyeComfortStore((state) => state.enable);
  const disable = useEyeComfortStore((state) => state.disable);
  const hydrate = useEyeComfortStore((state) => state.hydrate);

  useEffect(() => {
    if (!isInitialized) {
      void hydrate();
    }
  }, [hydrate, isInitialized]);

  return {
    level,
    customIntensity,
    isEnabled,
    setLevel,
    setCustomIntensity,
    toggle,
    enable,
    disable,
    hydrate,
  };
}
