// --- Imports ---
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import {
  ErrorBanner,
  Divider,
  FormInput,
  PasswordInput,
  RememberMeCheckbox,
  LinkButton,
  PrimaryButton,
  GoogleButton,
  FooterLink,
} from "./components";

// --- Constants ---
// Key used for storing the user's email in AsyncStorage for "Remember Me" functionality
const REMEMBER_ME_KEY = "auth_remember_me_email";

export default function LoginScreen() {
  // --- State & Hooks ---
  const { isDark } = useTheme(); // Theme context for dark/light mode
  const styles = getStyles(isDark); // Generate styles based on theme

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Toggle "Remember Me" checkbox
  const [loading, setLoading] = useState(false); // Loading state for login process
  const [authError, setAuthError] = useState<string | null>(null); // Authentication error message

  const router = useRouter(); // Navigation
  // Google Auth Hook
  const { promptAsync, loading: googleLoading } = useGoogleAuth();
  const { t } = useTranslation(); // i18n Translation hook

  // --- Effects ---
  // Load saved email on initial render if one exists in storage
  useEffect(() => {
    loadSavedEmail();
  }, []);

  // --- Helper Functions ---

  /**
   * Retrieves the saved email from AsyncStorage.
   * If found, pre-fills the email field and checks "Remember Me".
   */
  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.log("Error loading saved email:", error);
    }
  };

  /**
   * Handles the Email/Password Login flow.
   * 1. Validates inputs.
   * 2. Manages "Remember Me" persistence (save or remove email).
   * 3. Authenticates with Firebase.
   * 4. Navigates to the main tabs on success.
   */
  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError(t("auth.errors.missingCredentials"));
      return;
    }
    setAuthError(null);
    setLoading(true);
    try {
      // Handle Remember Me persistence
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }

      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (error: any) {
      setAuthError(error?.message ?? t("auth.errors.loginTitle"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Triggers the Google Sign-In flow using the useGoogleAuth hook.
   */
  const handleGoogleLogin = () => {
    setAuthError(null);
    promptAsync();
  };

  // --- Render ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Handle keyboard behavior to prevent inputs from being hidden */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Section: Header --- */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t("auth.login.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
          </View>

          {/* --- Section: Login Form --- */}
          <View style={styles.formContainer}>
            {/* Authentication Error Alert */}
            <ErrorBanner
              title={t("auth.errors.loginTitle")}
              message={authError || ""}
              onClose={() => setAuthError(null)}
            />

            {/* Feature: Email Input */}
            <FormInput
              icon="mail-outline"
              placeholder={t("auth.login.emailPlaceholder")}
              value={email}
              onChangeText={(value) => {
                if (authError) {
                  setAuthError(null);
                }
                setEmail(value);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {/* Feature: Password Input with Visibility Toggle */}
            <PasswordInput
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChangeText={(value) => {
                if (authError) {
                  setAuthError(null);
                }
                setPassword(value);
              }}
            />

            {/* Feature: Options Row (Remember Me & Forgot Password) */}
            <View style={styles.optionsContainer}>
              <RememberMeCheckbox
                checked={rememberMe}
                onToggle={() => setRememberMe(!rememberMe)}
                label={t("auth.login.rememberMe")}
              />
              <LinkButton
                text={t("auth.login.forgotPassword")}
                onPress={() => {
                  // TODO: Implement forgot password functionality
                }}
              />
            </View>

            {/* Feature: Sign In Button */}
            <PrimaryButton
              title={t("auth.login.signIn")}
              onPress={handleLogin}
              loading={loading}
              loadingTitle={t("auth.login.signingIn")}
            />

            {/* --- Section: Divider --- */}
            <Divider text={t("common.or")} />

            {/* Feature: Google Sign In Button */}
            <GoogleButton
              title={t("auth.login.googleSignIn")}
              onPress={handleGoogleLogin}
              loading={googleLoading}
              loadingTitle={t("auth.login.googleSigningIn")}
            />
          </View>

          {/* --- Section: Footer (Register Link) --- */}
          {/* Redirects user to Registration screen if they don't have an account */}
          <FooterLink
            text={t("auth.login.noAccount")}
            linkText={t("auth.login.signUp")}
            href="/(auth)/register"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
// Generates styles based on the current theme (isDark)
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      justifyContent: "center",
    },
    headerContainer: {
      marginBottom: 32,
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#333",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? "#ccc" : "#666",
    },
    formContainer: {
      marginBottom: 24,
    },
    optionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
  });
