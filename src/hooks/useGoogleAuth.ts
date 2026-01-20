import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { auth } from "../services/firebase";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const config = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: "imagevocaapp",
    }),
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(config);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(() => {
          // Navigation is handled by the auth state listener or the component calling this
        })
        .catch((error) => {
          Alert.alert("Google Sign-In Error", error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (response?.type === "error") {
      Alert.alert(
        "Google Sign-In Error",
        response.error?.message || "Something went wrong",
      );
    }
  }, [response]);

  const handlePromptAsync = async () => {
    const { iosClientId, androidClientId, webClientId } = config;
    const isConfigured =
      webClientId &&
      !webClientId.includes("YOUR_WEB_CLIENT_ID") &&
      ((Platform.OS === "ios" &&
        iosClientId &&
        !iosClientId.includes("YOUR_IOS_CLIENT_ID")) ||
        (Platform.OS === "android" &&
          androidClientId &&
          !androidClientId.includes("YOUR_ANDROID_CLIENT_ID")));

    if (!isConfigured) {
      Alert.alert(
        "Configuration Error",
        "Google Client IDs are missing or invalid in .env file. Please check configuration.",
      );
      return;
    }

    try {
      await promptAsync();
    } catch (e: any) {
      console.error("Google Sign In Error:", e);
      Alert.alert("Error", e.message);
    }
  };

  return {
    promptAsync: handlePromptAsync,
    request,
    loading,
  };
}
