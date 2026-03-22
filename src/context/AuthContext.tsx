import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, reload, User } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { getDefaultUserRole, getPrimaryAuthProvider } from "../services/userProfileService";
import { normalizeUserRole } from "../utils/role";

export type AuthStatus = "signed_out" | "pending_verification" | "signed_in";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authStatus: AuthStatus;
  needsEmailVerification: boolean;
  isAdminBypass: boolean;
  authError: string | null;
  setAuthError: (message: string | null) => void;
  clearAuthError: () => void;
  refreshAuthUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authStatus: "signed_out",
  needsEmailVerification: false,
  isAdminBypass: false,
  authError: null,
  setAuthError: () => {},
  clearAuthError: () => {},
  refreshAuthUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("signed_out");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const resolveAdminBypass = useCallback(async (nextUser: User) => {
    try {
      const snapshot = await getDoc(doc(db, "users", nextUser.uid));

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.role !== "undefined") {
          return normalizeUserRole(data.role) === "admin";
        }
      }
    } catch (error) {
      console.warn("Failed to resolve admin verification bypass", error);
    }

    return getDefaultUserRole(nextUser.email) === "admin";
  }, []);

  const resolveAuthState = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);

      if (!nextUser) {
        setNeedsEmailVerification(false);
        setIsAdminBypass(false);
        setAuthStatus("signed_out");
        setLoading(false);
        return;
      }

      const provider = getPrimaryAuthProvider(nextUser);
      const shouldVerifyEmail =
        provider === "password" && nextUser.emailVerified === false;

      setNeedsEmailVerification(shouldVerifyEmail);

      if (!shouldVerifyEmail) {
        setIsAdminBypass(false);
        setAuthStatus("signed_in");
        setLoading(false);
        return;
      }

      const hasAdminBypass = await resolveAdminBypass(nextUser);
      setIsAdminBypass(hasAdminBypass);
      setAuthStatus(hasAdminBypass ? "signed_in" : "pending_verification");
      setLoading(false);
    },
    [resolveAdminBypass],
  );

  const refreshAuthUser = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    setLoading(true);
    await reload(auth.currentUser);
    await resolveAuthState(auth.currentUser);
  }, [resolveAuthState]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setLoading(true);

      void (async () => {
        await resolveAuthState(nextUser);

        if (!isMounted) {
          return;
        }
      })();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [resolveAuthState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authStatus,
        needsEmailVerification,
        isAdminBypass,
        authError,
        setAuthError,
        clearAuthError: () => setAuthError(null),
        refreshAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
