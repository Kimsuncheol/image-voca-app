import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function useGoogleSheetsAuth() {
  const [token, setToken] = useState<string | null>(null);

  const config = {
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: "imagevocaapp",
    }),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  };

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    if (response?.type === "success") {
      const { accessToken } = response.authentication || {};
      if (accessToken) {
        setToken(accessToken);
      } else {
        // Fallback if needed, though useAuthRequest usually returns authentication object
        Alert.alert("Error", "No access token received.");
      }
    } else if (response?.type === "error") {
      Alert.alert(
        "Google Sign-In Error",
        response.error?.message || "Something went wrong",
      );
    }
  }, [response]);

  return {
    promptAsync,
    request,
    token, // The access token needed for Google Sheets API
  };
}
