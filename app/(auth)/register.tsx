import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/context/ThemeContext";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { auth, db } from "../../src/services/firebase";

export default function RegisterScreen() {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { promptAsync, loading: googleLoading } = useGoogleAuth();

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecial, setHasSpecial] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasNumber(/\d/.test(password));
    setHasSpecial(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    setPasswordsMatch(password === confirmPassword && password !== "");
  }, [password, confirmPassword]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert(
        t("auth.errors.permissionTitle"),
        t("auth.errors.permissionMessage")
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.errors.missingFields"));
      return;
    }

    if (!hasMinLength || !hasNumber || !hasSpecial) {
      Alert.alert(t("common.error"), t("auth.errors.passwordRequirements"));
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(t("common.error"), t("auth.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: avatarUri || null,
      });

      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: displayName,
        email: email,
        photoURL: avatarUri || null,
        createdAt: new Date().toISOString(),
        wordBank: [],
        recentCourse: null,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(t("auth.errors.registerTitle"), error.message);
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t("auth.register.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.register.subtitle")}</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Avatar Picker */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={isDark ? "#666" : "#999"}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>
                {t("auth.register.avatarLabel")}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.fullNamePlaceholder")}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.emailPlaceholder")}
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
                placeholder={t("auth.register.passwordPlaceholder")}
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

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isDark ? "#ccc" : "#666"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                  }
                  size={20}
                  color={isDark ? "#ccc" : "#666"}
                />
              </TouchableOpacity>
            </View>

            {/* Password Constraints Hints */}
            <View style={styles.hintsContainer}>
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasMinLength ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[
                    styles.hintText,
                    hasMinLength && styles.hintTextValid,
                  ]}
                >
                  {t("auth.register.passwordHint.length")}
                </Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasNumber ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[styles.hintText, hasNumber && styles.hintTextValid]}
                >
                  {t("auth.register.passwordHint.number")}
                </Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons
                  name={hasSpecial ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={hasSpecial ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[styles.hintText, hasSpecial && styles.hintTextValid]}
                >
                  {t("auth.register.passwordHint.special")}
                </Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons
                  name={passwordsMatch ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordsMatch ? "green" : isDark ? "#666" : "#666"}
                />
                <Text
                  style={[
                    styles.hintText,
                    passwordsMatch && styles.hintTextValid,
                  ]}
                >
                  {t("auth.register.passwordHint.match")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? t("auth.register.creatingAccount")
                  : t("auth.register.register")}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{t("common.or")}</Text>
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
                {googleLoading
                  ? t("auth.register.googleSigningIn")
                  : t("auth.register.googleSignIn")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {t("auth.register.hasAccount")}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>{t("auth.register.signIn")}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
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
    hintsContainer: {
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    hintRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    hintText: {
      marginLeft: 8,
      color: isDark ? "#ccc" : "#666",
      fontSize: 12,
    },
    hintTextValid: {
      color: "green",
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
    avatarContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    avatarButton: {
      marginBottom: 8,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#007AFF",
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: isDark ? "#1c1c1e" : "#F9F9F9",
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#E0E0E0",
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
    },
    avatarLabel: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
    },
  });
