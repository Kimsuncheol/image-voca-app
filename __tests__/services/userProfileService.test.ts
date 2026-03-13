import { ensureUserProfileDocument } from "../../src/services/userProfileService";
import { doc, getDoc, setDoc } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((_db, ...segments: string[]) => segments.join("/")),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock("../../src/services/firebase", () => ({
  db: {},
}));

const mockSnapshot = (data?: Record<string, unknown>) => ({
  exists: () => Boolean(data),
  data: () => data,
});

describe("ensureUserProfileDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new email/password user profile with defaults", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce(mockSnapshot());

    await ensureUserProfileDocument({
      uid: "user-1",
      displayName: "Email User",
      email: "email@example.com",
      photoURL: null,
      providerData: [{ providerId: "password" }] as any,
    });

    expect(doc).toHaveBeenCalledWith({}, "users", "user-1");
    expect(setDoc).toHaveBeenCalledWith(
      "users/user-1",
      expect.objectContaining({
        uid: "user-1",
        displayName: "Email User",
        email: "email@example.com",
        photoURL: null,
        role: "student",
        wordBank: [],
        recentCourse: null,
      }),
      { merge: true },
    );
  });

  it("creates a new Google user profile from auth data", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce(mockSnapshot());

    await ensureUserProfileDocument({
      uid: "google-user",
      displayName: "Google User",
      email: "google@example.com",
      photoURL: "https://example.com/avatar.png",
      providerData: [{ providerId: "google.com" }] as any,
    });

    expect(setDoc).toHaveBeenCalledWith(
      "users/google-user",
      expect.objectContaining({
        uid: "google-user",
        displayName: "Google User",
        email: "google@example.com",
        photoURL: "https://example.com/avatar.png",
        role: "student",
      }),
      { merge: true },
    );
  });

  it("merges defaults for an existing user document without clobbering persisted fields", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce(
      mockSnapshot({
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
        wordBank: ["already-saved"],
        recentCourse: "TOEIC",
      }),
    );

    await ensureUserProfileDocument(
      {
        uid: "existing-user",
        displayName: "Updated Name",
        email: "admin@example.com",
        photoURL: "https://example.com/new-avatar.png",
        providerData: [{ providerId: "google.com" }] as any,
      },
      {
        role: "student",
      },
    );

    expect(setDoc).toHaveBeenCalledWith(
      "users/existing-user",
      expect.objectContaining({
        uid: "existing-user",
        displayName: "Updated Name",
        email: "admin@example.com",
        photoURL: "https://example.com/new-avatar.png",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
        wordBank: ["already-saved"],
        recentCourse: "TOEIC",
      }),
      { merge: true },
    );
  });
});
