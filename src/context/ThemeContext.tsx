import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeType = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    const updateTheme = async () => {
      let isDarkMode = systemColorScheme === "dark";
      if (theme === "light") isDarkMode = false;
      if (theme === "dark") isDarkMode = true;

      setIsDark(isDarkMode);
      await AsyncStorage.setItem("user_theme", theme);
    };

    updateTheme();
  }, [theme, systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("user_theme");
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error("Failed to load theme", error);
    }
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
