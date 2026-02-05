/**
 * Type definitions for Advertisement Management System
 */

export type AdType = "image" | "video";

export interface Advertisement {
  adId: string; // Document ID from Firestore
  type: AdType; // Image or video
  imageUrl?: string; // Firebase Storage URL (for uploaded images)
  videoUrl?: string; // External URL (for videos)
  title: string; // Admin reference name
  description: string; // Admin notes
  active: boolean; // Whether to display in rotation
  createdAt: string; // ISO timestamp
  createdBy: string; // Admin user ID
}

export interface AdFormData {
  type: AdType;
  imageFile?: { uri: string }; // Selected image file
  videoUrl?: string; // Video URL input
  title: string;
  description: string;
}
