import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (theme !== "system") {
    return theme;
  }

  if (!hasHydrated) {
    return "light";
  }

  return useRNColorScheme() ?? "light";
}
