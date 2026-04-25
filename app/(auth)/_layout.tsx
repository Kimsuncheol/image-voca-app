import { Stack } from "expo-router";
import { getBackgroundColors } from "../../constants/backgroundColors";
import { useTheme } from "../../src/context/ThemeContext";

export default function AuthLayout() {
  const { isDark } = useTheme();
  const bgColors = getBackgroundColors(isDark);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bgColors.screen },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
