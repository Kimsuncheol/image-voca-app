import { useColorScheme as useSystemColorScheme } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";

export function useColorScheme() {
  const systemScheme = useSystemColorScheme() ?? "light";
  const { theme } = useTheme();

  if (theme === "system") {
    return systemScheme;
  }

  return theme;
}
