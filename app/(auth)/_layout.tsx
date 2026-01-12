import { Stack } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";

export default function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? "#000" : "#fff" },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
