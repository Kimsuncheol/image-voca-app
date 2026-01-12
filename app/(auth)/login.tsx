import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { auth } from "../../src/services/firebase";

import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";

const REMEMBER_ME_KEY = "auth_remember_me_email";

export default function LoginScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { promptAsync, loading: googleLoading } = useGoogleAuth();

  useEffect(() => {
    loadSavedEmail();
  }, []);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
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
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={isDark ? "#ccc" : "#666"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={isDark ? "#666" : "#999"}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={isDark ? "#ccc" : "#666"}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
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

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

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
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    keyboardView: {
      flex: 1,
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
