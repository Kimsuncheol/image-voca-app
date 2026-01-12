import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // User needs to provide this
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (response?.type === 'success') {
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
    }
  }, [response]);

  return {
    promptAsync,
    request,
    loading,
  };
}
