// --- Imports ---
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";

import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";

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
  const [passwordVisible, setPasswordVisible] = useState(false); // Toggle password visibility
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
            {authError ? (
              <View style={styles.errorAlert} accessibilityRole="alert">
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={isDark ? "#FF8A8A" : "#D93025"}
                  style={styles.errorIcon}
                />
                <View style={styles.errorTextContainer}>
                  <Text style={styles.errorTitle}>
                    {t("auth.errors.loginTitle")}
                  </Text>
                  <Text style={styles.errorMessage}>{authError}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAuthError(null)}
                  accessibilityLabel={t("common.close")}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isDark ? "#FF8A8A" : "#D93025"}
                  />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Feature: Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
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
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            </View>

            {/* Feature: Password Input with Visibility Toggle */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.login.passwordPlaceholder")}
                value={password}
                onChangeText={(value) => {
                  if (authError) {
                    setAuthError(null);
                  }
                  setPassword(value);
                }}
                secureTextEntry={!passwordVisible}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#ccc" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* Feature: Options Row (Remember Me & Forgot Password) */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>
                  {t("auth.login.rememberMe")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  {t("auth.login.forgotPassword")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feature: Sign In Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t("auth.login.signingIn") : t("auth.login.signIn")}
              </Text>
            </TouchableOpacity>

            {/* --- Section: Divider --- */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("common.or")}</Text>
              <View style={styles.divider} />
            </View>

            {/* Feature: Google Sign In Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                googleLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="#DB4437"
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                {googleLoading
                  ? t("auth.login.googleSigningIn")
                  : t("auth.login.googleSignIn")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* --- Section: Footer (Register Link) --- */}
          {/* Redirects user to Registration screen if they don't have an account */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>{t("auth.login.noAccount")}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>{t("auth.login.signUp")}</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    errorAlert: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: isDark ? "#2A1414" : "#FFF1F1",
      borderColor: isDark ? "#5C1F1F" : "#F5B5B5",
    },
    errorIcon: {
      marginRight: 10,
    },
    errorTextContainer: {
      flex: 1,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFB3B3" : "#D93025",
      marginBottom: 2,
    },
    errorMessage: {
      fontSize: 13,
      color: isDark ? "#FFD5D5" : "#8A1C1C",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#fff" : "#333",
    },
    optionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    rememberMeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: isDark ? "#888" : "#666",
      marginRight: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
    rememberMeText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 14,
    },
    forgotPassword: {
      // alignSelf: "flex-end", // Removed as it's now in a row
    },
    forgotPasswordText: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "600",
    },
    button: {
      backgroundColor: "#007AFF",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: "#007AFF",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#333" : "#E0E0E0",
    },
    dividerText: {
      marginHorizontal: 16,
      color: isDark ? "#888" : "#999",
      fontWeight: "600",
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#E0E0E0",
      paddingVertical: 16,
      borderRadius: 12,
    },
    googleIcon: {
      marginRight: 12,
    },
    googleButtonText: {
      color: isDark ? "#fff" : "#333",
      fontSize: 16,
      fontWeight: "600",
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    footerText: {
      color: isDark ? "#ccc" : "#666",
      fontSize: 14,
    },
    link: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "bold",
    },
  });
