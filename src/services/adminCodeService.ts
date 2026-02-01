/**
 * Admin Code Service
 *
 * Handles generation and validation of admin registration codes.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  AdminCode,
  AdminCodeGenerationOptions,
  AdminCodeValidationResult,
} from "../types/adminCode";

/**
 * Generate a random admin code in format: ADMIN-XXX-YYY
 * Example: ADMIN-A7K-9M2
 */
export const generateAdminCodeString = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous characters
  const segment1 = Array.from({ length: 3 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
  const segment2 = Array.from({ length: 3 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
  return `ADMIN-${segment1}-${segment2}`;
};

/**
 * Create a new admin code in Firestore
 */
export const createAdminCode = async (
  createdByUserId: string,
  options: AdminCodeGenerationOptions = {}
): Promise<AdminCode> => {
  const code = generateAdminCodeString();
  const now = new Date();
  const expiresAt = options.expiresInDays
    ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  const adminCode: AdminCode = {
    code,
    createdAt: now.toISOString(),
    createdBy: createdByUserId,
    expiresAt: expiresAt?.toISOString(),
    maxUses: options.maxUses ?? 1,
    currentUses: 0,
    isActive: true,
    description: options.description,
  };

  // Store in Firestore
  const codeRef = doc(db, "adminCodes", code);
  await setDoc(codeRef, adminCode);

  return adminCode;
};

/**
 * Validate an admin code
 */
export const validateAdminCode = async (
  code: string
): Promise<AdminCodeValidationResult> => {
  // Normalize code to uppercase and trim whitespace
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      isValid: false,
      errorMessage: "Please enter an admin code",
    };
  }

  // Check format (ADMIN-XXX-YYY)
  const formatRegex = /^ADMIN-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
  if (!formatRegex.test(normalizedCode)) {
    return {
      isValid: false,
      errorMessage: "Invalid admin code format",
    };
  }

  try {
    // Fetch code from Firestore
    const codeRef = doc(db, "adminCodes", normalizedCode);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      return {
        isValid: false,
        errorMessage: "Admin code not found",
      };
    }

    const adminCode = codeDoc.data() as AdminCode;

    // Check if code is active
    if (!adminCode.isActive) {
      return {
        isValid: false,
        errorMessage: "This admin code has been deactivated",
      };
    }

    // Check if code has expired
    if (adminCode.expiresAt) {
      const expiryDate = new Date(adminCode.expiresAt);
      if (expiryDate < new Date()) {
        return {
          isValid: false,
          errorMessage: "This admin code has expired",
        };
      }
    }

    // Check if code has reached max uses
    if (
      adminCode.maxUses !== -1 &&
      adminCode.currentUses >= adminCode.maxUses
    ) {
      return {
        isValid: false,
        errorMessage: "This admin code has reached its usage limit",
      };
    }

    // Code is valid
    return {
      isValid: true,
      code: adminCode,
    };
  } catch (error) {
    console.error("Error validating admin code:", error);
    return {
      isValid: false,
      errorMessage: "Failed to validate admin code",
    };
  }
};

/**
 * Mark an admin code as used
 */
export const markAdminCodeAsUsed = async (code: string): Promise<void> => {
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = doc(db, "adminCodes", normalizedCode);

  try {
    const codeDoc = await getDoc(codeRef);
    if (codeDoc.exists()) {
      const adminCode = codeDoc.data() as AdminCode;
      await updateDoc(codeRef, {
        currentUses: adminCode.currentUses + 1,
      });
    }
  } catch (error) {
    console.error("Error marking admin code as used:", error);
  }
};

/**
 * Deactivate an admin code
 */
export const deactivateAdminCode = async (code: string): Promise<void> => {
  const codeRef = doc(db, "adminCodes", code);
  await updateDoc(codeRef, {
    isActive: false,
  });
};

/**
 * Get all admin codes
 */
export const getAllAdminCodes = async (): Promise<AdminCode[]> => {
  const codesRef = collection(db, "adminCodes");
  const querySnapshot = await getDocs(codesRef);

  const codes: AdminCode[] = [];
  querySnapshot.forEach((doc) => {
    codes.push(doc.data() as AdminCode);
  });

  // Sort by creation date (newest first)
  codes.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return codes;
};

/**
 * Get active admin codes only
 */
export const getActiveAdminCodes = async (): Promise<AdminCode[]> => {
  const codesRef = collection(db, "adminCodes");
  const q = query(codesRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);

  const codes: AdminCode[] = [];
  querySnapshot.forEach((doc) => {
    codes.push(doc.data() as AdminCode);
  });

  // Sort by creation date (newest first)
  codes.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return codes;
};
