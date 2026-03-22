import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";

const mockOnAuthStateChanged = jest.fn();
const mockReload = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();

type ListenerUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  providerData: { providerId: string }[];
};

let authStateListener: ((user: ListenerUser | null) => void) | null = null;

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  reload: (...args: unknown[]) => mockReload(...args),
}));

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

jest.mock("../../src/services/firebase", () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

function AuthStateProbe() {
  const {
    authStatus,
    needsEmailVerification,
    isAdminBypass,
  } = useAuth();

  return (
    <>
      <Text>{`status:${authStatus}`}</Text>
      <Text>{`needs:${String(needsEmailVerification)}`}</Text>
      <Text>{`admin:${String(isAdminBypass)}`}</Text>
    </>
  );
}

const emitAuthState = async (user: ListenerUser | null) => {
  await act(async () => {
    authStateListener?.(user);
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateListener = null;
    mockDoc.mockReturnValue("user-doc-ref");
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: ListenerUser | null) => void) => {
        authStateListener = callback;
        return jest.fn();
      },
    );
  });

  const renderProbe = () =>
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

  it("marks unverified password users as pending verification", async () => {
    const screen = renderProbe();

    await emitAuthState({
      uid: "user-1",
      email: "student@example.com",
      emailVerified: false,
      providerData: [{ providerId: "password" }],
    });

    await waitFor(() => {
      expect(screen.getByText("status:pending_verification")).toBeTruthy();
      expect(screen.getByText("needs:true")).toBeTruthy();
      expect(screen.getByText("admin:false")).toBeTruthy();
    });
  });

  it("treats verified password users as signed in", async () => {
    const screen = renderProbe();

    await emitAuthState({
      uid: "user-2",
      email: "student@example.com",
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    });

    await waitFor(() => {
      expect(screen.getByText("status:signed_in")).toBeTruthy();
      expect(screen.getByText("needs:false")).toBeTruthy();
    });
  });

  it("does not require verification for google accounts", async () => {
    const screen = renderProbe();

    await emitAuthState({
      uid: "user-3",
      email: "google@example.com",
      emailVerified: false,
      providerData: [{ providerId: "google.com" }],
    });

    await waitFor(() => {
      expect(screen.getByText("status:signed_in")).toBeTruthy();
      expect(screen.getByText("needs:false")).toBeTruthy();
    });
  });

  it("allows admin bypass for unverified password users with admin role", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "admin" }),
    });

    const screen = renderProbe();

    await emitAuthState({
      uid: "admin-1",
      email: "admin@example.com",
      emailVerified: false,
      providerData: [{ providerId: "password" }],
    });

    await waitFor(() => {
      expect(screen.getByText("status:signed_in")).toBeTruthy();
      expect(screen.getByText("needs:true")).toBeTruthy();
      expect(screen.getByText("admin:true")).toBeTruthy();
    });
  });
});
