/**
 * Test utility for verifying account deletion
 * This file contains functions to test and verify that account deletion works correctly
 */

import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../services/firebase";

/**
 * Verifies that a user's data has been completely deleted
 * @param userId - The user ID to check
 * @returns Object containing verification results
 */
export async function verifyUserDataDeleted(
  userId: string,
): Promise<{
  firestoreDeleted: boolean;
  storageDeleted: boolean;
  allDeleted: boolean;
  details: string[];
}> {
  console.log("🔍 Starting verification for user:", userId);
  const details: string[] = [];
  let firestoreDeleted = false;
  let storageDeleted = false;

  // Check Firestore document
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      firestoreDeleted = true;
      details.push("✅ Firestore document: DELETED");
      console.log("✅ Firestore document successfully deleted");
    } else {
      details.push("❌ Firestore document: STILL EXISTS");
      console.error("❌ Firestore document still exists!");
    }
  } catch (error: any) {
    details.push(`⚠️ Firestore check error: ${error.message}`);
    console.error("⚠️ Error checking Firestore:", error);
  }

  // Check Storage profile image
  try {
    const profileImageRef = ref(storage, `profile_images/${userId}`);
    await getDownloadURL(profileImageRef);
    // If we get here, the file still exists
    details.push("❌ Storage profile image: STILL EXISTS");
    console.error("❌ Storage profile image still exists!");
    storageDeleted = false;
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      storageDeleted = true;
      details.push("✅ Storage profile image: DELETED (or never existed)");
      console.log("✅ Storage profile image deleted or never existed");
    } else {
      details.push(`⚠️ Storage check error: ${error.message}`);
      console.error("⚠️ Error checking Storage:", error);
    }
  }

  const allDeleted = firestoreDeleted && storageDeleted;

  console.log("📊 Verification Results:");
  console.log(`  - Firestore: ${firestoreDeleted ? "DELETED ✅" : "STILL EXISTS ❌"}`);
  console.log(`  - Storage: ${storageDeleted ? "DELETED ✅" : "STILL EXISTS ❌"}`);
  console.log(`  - Overall: ${allDeleted ? "SUCCESS ✅" : "FAILED ❌"}`);

  return {
    firestoreDeleted,
    storageDeleted,
    allDeleted,
    details,
  };
}

/**
 * Test function to simulate account deletion verification
 * Call this after deleting an account to verify everything was cleaned up
 */
export async function testAccountDeletion(userId: string): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 STARTING ACCOUNT DELETION TEST");
  console.log("=".repeat(60));
  console.log(`User ID: ${userId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(60) + "\n");

  const result = await verifyUserDataDeleted(userId);

  console.log("\n" + "=".repeat(60));
  console.log("📋 TEST RESULTS:");
  console.log("=".repeat(60));
  result.details.forEach((detail) => console.log(detail));
  console.log("=".repeat(60));

  if (result.allDeleted) {
    console.log("🎉 TEST PASSED: All user data successfully deleted!");
  } else {
    console.error("❌ TEST FAILED: Some user data still exists!");
  }

  console.log("=".repeat(60) + "\n");
}

/**
 * Check if user data exists before deletion (for before/after comparison)
 */
export async function checkUserDataExists(
  userId: string,
): Promise<{
  firestoreExists: boolean;
  storageExists: boolean;
}> {
  let firestoreExists = false;
  let storageExists = false;

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    firestoreExists = userDoc.exists();
  } catch (error) {
    console.error("Error checking Firestore:", error);
  }

  try {
    const profileImageRef = ref(storage, `profile_images/${userId}`);
    await getDownloadURL(profileImageRef);
    storageExists = true;
  } catch (error: any) {
    storageExists = error.code !== "storage/object-not-found";
  }

  console.log("📊 Current user data status:");
  console.log(`  - Firestore document: ${firestoreExists ? "EXISTS" : "NOT FOUND"}`);
  console.log(`  - Storage profile image: ${storageExists ? "EXISTS" : "NOT FOUND"}`);

  return { firestoreExists, storageExists };
}
