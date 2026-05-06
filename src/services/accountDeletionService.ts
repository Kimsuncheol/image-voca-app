import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { deleteUserDeviceRegistrations } from "./deviceRegistrationService";
import { auth, db, storage } from "./firebase";

const cleanupUserData = async (userId: string) => {
  try {
    const profileImageRef = ref(storage, `profile_images/${userId}`);
    await deleteObject(profileImageRef);
  } catch (storageError: any) {
    if (storageError?.code !== "storage/object-not-found") {
      console.warn("Failed to delete profile image", storageError);
    }
  }

  await deleteUserDeviceRegistrations(userId);
  await deleteDoc(doc(db, "users", userId));
};

export const deleteCurrentUserAccount = async (password: string) => {
  const user = auth.currentUser;

  if (!user?.email) {
    throw new Error("No password-authenticated user is available.");
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await cleanupUserData(user.uid);
  await deleteUser(user);
};
