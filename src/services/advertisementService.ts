/**
 * Advertisement Service
 *
 * Handles Firebase operations for the advertisement management system.
 * Provides CRUD operations for advertisements stored in Firestore and Firebase Storage.
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import type { Advertisement, AdFormData } from "../types/advertisement";

const ADS_COLLECTION = "ads";

/**
 * Fetches all advertisements from Firestore
 * Used by admin screen to display all ads (active and inactive)
 */
export async function getAllAdvertisements(): Promise<Advertisement[]> {
  try {
    const adsRef = collection(db, ADS_COLLECTION);
    const q = query(adsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      adId: doc.id,
      ...doc.data(),
    })) as Advertisement[];
  } catch (error) {
    console.error("[AdService] Failed to fetch all advertisements:", error);
    throw new Error("Failed to load advertisements");
  }
}

/**
 * Fetches only active advertisements for display
 * Used by advertisement-modal to show ads to users
 */
export async function getActiveAdvertisements(): Promise<Advertisement[]> {
  try {
    const adsRef = collection(db, ADS_COLLECTION);
    const q = query(adsRef, where("active", "==", true));
    const snapshot = await getDocs(q);

    const ads = snapshot.docs.map((doc) => ({
      adId: doc.id,
      ...doc.data(),
    })) as Advertisement[];

    console.log(`[AdService] Fetched ${ads.length} active advertisements`);
    return ads;
  } catch (error) {
    console.error("[AdService] Failed to fetch active ads:", error);
    return []; // Fallback to empty array for graceful degradation
  }
}

/**
 * Creates a new advertisement
 * Handles image upload to Firebase Storage if image type
 */
export async function createAdvertisement(
  formData: AdFormData,
  userId: string
): Promise<string> {
  try {
    // Create Firestore document first
    const adsRef = collection(db, ADS_COLLECTION);
    const docRef = await addDoc(adsRef, {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      active: true, // New ads are active by default
      createdAt: new Date().toISOString(),
      createdBy: userId,
    });

    const adId = docRef.id;
    console.log(`[AdService] Created ad document: ${adId}`);

    // Handle image upload if type is image
    if (formData.type === "image" && formData.imageFile) {
      // Fetch image as blob
      const response = await fetch(formData.imageFile.uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `ads/${adId}/image.jpg`);
      await uploadBytes(storageRef, blob);
      console.log(`[AdService] Uploaded image to Storage: ads/${adId}/image.jpg`);

      // Get download URL
      const imageUrl = await getDownloadURL(storageRef);

      // Update Firestore with image URL
      await updateDoc(docRef, { imageUrl });
      console.log(`[AdService] Updated ad with imageUrl: ${imageUrl}`);
    }

    // Handle video URL if type is video
    if (formData.type === "video" && formData.videoUrl) {
      await updateDoc(docRef, { videoUrl: formData.videoUrl });
      console.log(`[AdService] Updated ad with videoUrl: ${formData.videoUrl}`);
    }

    return adId;
  } catch (error) {
    console.error("[AdService] Failed to create advertisement:", error);
    throw new Error("Failed to create advertisement");
  }
}

/**
 * Toggles advertisement active status
 * Used to enable/disable ad display without deletion
 */
export async function toggleAdStatus(
  adId: string,
  active: boolean
): Promise<void> {
  try {
    const docRef = doc(db, ADS_COLLECTION, adId);
    await updateDoc(docRef, { active });
    console.log(`[AdService] Toggled ad ${adId} to ${active ? "active" : "inactive"}`);
  } catch (error) {
    console.error("[AdService] Failed to toggle ad status:", error);
    throw new Error("Failed to update advertisement status");
  }
}

/**
 * Deletes an advertisement
 * Removes both Firestore document and Storage files
 */
export async function deleteAdvertisement(adId: string): Promise<void> {
  try {
    // Try to delete Storage file (may not exist for video ads)
    try {
      const storageRef = ref(storage, `ads/${adId}/image.jpg`);
      await deleteObject(storageRef);
      console.log(`[AdService] Deleted Storage file: ads/${adId}/image.jpg`);
    } catch (storageError: any) {
      // File might not exist (video ad), continue
      if (storageError.code !== "storage/object-not-found") {
        console.warn("[AdService] Storage deletion warning:", storageError);
      }
    }

    // Delete Firestore document
    const docRef = doc(db, ADS_COLLECTION, adId);
    await deleteDoc(docRef);
    console.log(`[AdService] Deleted ad document: ${adId}`);
  } catch (error) {
    console.error("[AdService] Failed to delete advertisement:", error);
    throw new Error("Failed to delete advertisement");
  }
}

/**
 * Selects a random advertisement from array
 * Simple random selection without weighting
 */
export function selectRandomAd(
  ads: Advertisement[]
): Advertisement | null {
  if (ads.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * ads.length);
  return ads[randomIndex];
}
