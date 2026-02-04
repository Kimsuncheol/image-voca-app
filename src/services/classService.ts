/**
 * Class Service
 *
 * Handles all Firestore operations for the classes collection including:
 * - Class CRUD operations
 * - Student enrollment management
 * - Invite code generation and validation
 */

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
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
  Class,
  ClassWithStudents,
  CreateClassData,
  StudentListItem,
} from "../types/teacher";

// Firestore collection names
const CLASSES_COLLECTION = "classes";
const USERS_COLLECTION = "users";

/**
 * Generate a unique 6-character invite code
 * Format: Uppercase letters and numbers (e.g., "A1B2C3")
 * @returns 6-character code
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate if an invite code exists and is valid
 * @param code Invite code to validate
 * @returns true if code is valid and class is active
 */
export async function validateInviteCode(code: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where("inviteCode", "==", code.toUpperCase()),
      where("isArchived", "==", false)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error validating invite code:", error);
    return false;
  }
}

/**
 * Create a new class
 * @param teacherId Teacher's user ID
 * @param data Class creation data
 * @returns Created class ID
 * @throws Error if validation fails or creation fails
 */
export async function createClass(
  teacherId: string,
  data: CreateClassData
): Promise<string> {
  // Input validation
  if (!teacherId || typeof teacherId !== "string") {
    throw new Error("Invalid teacher ID");
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Class name is required");
  }

  if (data.name.trim().length > 100) {
    throw new Error("Class name must be 100 characters or less");
  }

  if (!data.courseIds || data.courseIds.length === 0) {
    throw new Error("At least one course must be selected");
  }

  if (data.courseIds.length > 10) {
    throw new Error("Maximum 10 courses per class");
  }

  try {
    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;

    // Ensure invite code is unique (max 5 attempts)
    for (let i = 0; i < 5; i++) {
      const exists = await validateInviteCode(inviteCode);
      if (!exists) {
        isUnique = true;
        break;
      }
      inviteCode = generateInviteCode();
    }

    if (!isUnique) {
      throw new Error("Unable to generate unique invite code. Please try again.");
    }

    const now = new Date().toISOString();

    const classData: Omit<Class, "id"> = {
      teacherId,
      name: data.name.trim(),
      description: data.description?.trim() || "",
      courseIds: data.courseIds,
      studentIds: [],
      inviteCode,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      settings: {
        dailyGoal: data.settings.dailyGoal,
        allowSelfEnrollment: data.settings.allowSelfEnrollment ?? true,
      },
    };

    const docRef = await addDoc(
      collection(db, CLASSES_COLLECTION),
      classData
    );

    // Update teacher's profile with class count
    await updateTeacherClassCount(teacherId, 1);

    return docRef.id;
  } catch (error: unknown) {
    console.error("Error creating class:", error);
    // Preserve original error message if available
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create class. Please try again.");
  }
}

/**
 * Get all classes for a teacher
 * @param teacherId Teacher's user ID
 * @param includeArchived Whether to include archived classes
 * @returns Array of classes
 */
export async function getTeacherClasses(
  teacherId: string,
  includeArchived: boolean = false
): Promise<Class[]> {
  try {
    let q;
    if (includeArchived) {
      q = query(
        collection(db, CLASSES_COLLECTION),
        where("teacherId", "==", teacherId)
      );
    } else {
      q = query(
        collection(db, CLASSES_COLLECTION),
        where("teacherId", "==", teacherId),
        where("isArchived", "==", false)
      );
    }

    const snapshot = await getDocs(q);
    const classes: Class[] = [];

    snapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() } as Class);
    });

    // Sort by createdAt descending (newest first)
    classes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return classes;
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    throw new Error("Failed to load classes");
  }
}

/**
 * Get detailed class information with full student profiles
 * @param classId Class ID
 * @returns Class with student details
 */
export async function getClassDetails(
  classId: string
): Promise<ClassWithStudents> {
  try {
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));

    if (!classDoc.exists()) {
      throw new Error("Class not found");
    }

    const classData = { id: classDoc.id, ...classDoc.data() } as Class;

    // Fetch student profiles
    const students = await getStudentProfiles(classData.studentIds);

    return {
      ...classData,
      students,
    };
  } catch (error) {
    console.error("Error fetching class details:", error);
    throw new Error("Failed to load class details");
  }
}

/**
 * Get student profiles for given user IDs
 * @param studentIds Array of student user IDs
 * @returns Array of student profile data
 */
async function getStudentProfiles(
  studentIds: string[]
): Promise<StudentListItem[]> {
  if (studentIds.length === 0) {
    return [];
  }

  try {
    const studentPromises = studentIds.map(async (studentId) => {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();

      // Calculate total words learned from dailyStats
      const dailyStats = userData.dailyStats || [];
      const totalWords = dailyStats.reduce(
        (sum: number, day: any) => sum + (day.wordsLearned || 0),
        0
      );

      return {
        uid: studentId,
        displayName: userData.displayName || "Unknown",
        photoURL: userData.photoURL,
        email: userData.email || "",
        currentStreak: userData.currentStreak || 0,
        wordsLearned: totalWords,
        lastActiveDate: userData.lastActiveDate || "",
      } as StudentListItem;
    });

    const results = await Promise.all(studentPromises);

    // Filter out null values (students who don't exist)
    return results.filter((student) => student !== null) as StudentListItem[];
  } catch (error) {
    console.error("Error fetching student profiles:", error);
    return [];
  }
}

/**
 * Update class information
 * @param classId Class ID
 * @param updates Partial class data to update
 */
export async function updateClass(
  classId: string,
  updates: Partial<Omit<Class, "id" | "teacherId" | "createdAt">>
): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, CLASSES_COLLECTION, classId), updateData);
  } catch (error) {
    console.error("Error updating class:", error);
    throw new Error("Failed to update class");
  }
}

/**
 * Archive a class (soft delete)
 * @param classId Class ID
 */
export async function archiveClass(classId: string): Promise<void> {
  try {
    await updateDoc(doc(db, CLASSES_COLLECTION, classId), {
      isArchived: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error archiving class:", error);
    throw new Error("Failed to archive class");
  }
}

/**
 * Permanently delete a class
 * WARNING: This cannot be undone
 * @param classId Class ID
 */
export async function deleteClass(classId: string): Promise<void> {
  try {
    // Get class to find teacherId
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (classDoc.exists()) {
      const classData = classDoc.data() as Class;

      // Remove class from all students' profiles
      for (const studentId of classData.studentIds) {
        await removeClassFromStudentProfile(studentId, classId);
      }

      // Update teacher's class count
      await updateTeacherClassCount(classData.teacherId, -1);

      // Delete the class document
      await deleteDoc(doc(db, CLASSES_COLLECTION, classId));
    }
  } catch (error) {
    console.error("Error deleting class:", error);
    throw new Error("Failed to delete class");
  }
}

/**
 * Add a student to a class
 * @param classId Class ID
 * @param studentId Student's user ID
 * @throws Error if validation fails or class not found
 */
export async function addStudentToClass(
  classId: string,
  studentId: string
): Promise<void> {
  // Input validation
  if (!classId || typeof classId !== "string") {
    throw new Error("Invalid class ID");
  }

  if (!studentId || typeof studentId !== "string") {
    throw new Error("Invalid student ID");
  }

  try {
    // Verify student exists
    const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
    if (!studentDoc.exists()) {
      throw new Error("Student not found");
    }

    // Get class details
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (!classDoc.exists()) {
      throw new Error("Class not found");
    }

    const classData = classDoc.data() as Class;

    // Check if class is archived
    if (classData.isArchived) {
      throw new Error("Cannot add students to an archived class");
    }

    // Check if student is already enrolled
    if (classData.studentIds.includes(studentId)) {
      throw new Error("Student is already enrolled in this class");
    }

    // Add student to class
    await updateDoc(doc(db, CLASSES_COLLECTION, classId), {
      studentIds: arrayUnion(studentId),
      updatedAt: new Date().toISOString(),
    });

    // Add class to student's profile
    await updateDoc(doc(db, USERS_COLLECTION, studentId), {
      "studentProfile.classIds": arrayUnion(classId),
      "studentProfile.teacherIds": arrayUnion(classData.teacherId),
    });

    // Update teacher's total student count
    await updateTeacherStudentCount(classData.teacherId, 1);
  } catch (error: unknown) {
    console.error("Error adding student to class:", error);
    // Preserve original error message if available
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add student to class. Please try again.");
  }
}

/**
 * Remove a student from a class
 * @param classId Class ID
 * @param studentId Student's user ID
 */
export async function removeStudentFromClass(
  classId: string,
  studentId: string
): Promise<void> {
  try {
    // Get class details
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (!classDoc.exists()) {
      throw new Error("Class not found");
    }

    const classData = classDoc.data() as Class;

    // Remove student from class
    await updateDoc(doc(db, CLASSES_COLLECTION, classId), {
      studentIds: arrayRemove(studentId),
      updatedAt: new Date().toISOString(),
    });

    // Remove class from student's profile
    await removeClassFromStudentProfile(studentId, classId);

    // Update teacher's total student count
    await updateTeacherStudentCount(classData.teacherId, -1);
  } catch (error) {
    console.error("Error removing student from class:", error);
    throw new Error("Failed to remove student from class");
  }
}

/**
 * Remove class from student's profile
 * Also removes teacherId if student is no longer in any classes by that teacher
 * @param studentId Student's user ID
 * @param classId Class ID
 */
async function removeClassFromStudentProfile(
  studentId: string,
  classId: string
): Promise<void> {
  try {
    // Get the class to find the teacher ID
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (!classDoc.exists()) {
      return; // Class doesn't exist, nothing to do
    }

    const classData = classDoc.data() as Class;
    const teacherId = classData.teacherId;

    // Remove class from student's profile
    await updateDoc(doc(db, USERS_COLLECTION, studentId), {
      "studentProfile.classIds": arrayRemove(classId),
    });

    // Check if student is still in any other classes by the same teacher
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where("teacherId", "==", teacherId),
      where("studentIds", "array-contains", studentId),
      where("isArchived", "==", false)
    );

    const snapshot = await getDocs(q);

    // If student is not in any other classes by this teacher, remove teacherId
    if (snapshot.empty) {
      await updateDoc(doc(db, USERS_COLLECTION, studentId), {
        "studentProfile.teacherIds": arrayRemove(teacherId),
      });
    }
  } catch (error) {
    console.error("Error removing class from student profile:", error);
    // Don't throw - this is a cleanup operation
  }
}

/**
 * Get all classes a student is enrolled in
 * @param studentId Student's user ID
 * @returns Array of classes
 */
export async function getStudentClasses(
  studentId: string
): Promise<Class[]> {
  try {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where("studentIds", "array-contains", studentId),
      where("isArchived", "==", false)
    );

    const snapshot = await getDocs(q);
    const classes: Class[] = [];

    snapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() } as Class);
    });

    // Sort by name
    classes.sort((a, b) => a.name.localeCompare(b.name));

    return classes;
  } catch (error) {
    console.error("Error fetching student classes:", error);
    throw new Error("Failed to load classes");
  }
}

/**
 * Join a class using an invite code
 * @param studentId Student's user ID
 * @param inviteCode 6-character invite code
 * @returns Class ID of joined class
 * @throws Error if validation fails or class not found
 */
export async function joinClassByCode(
  studentId: string,
  inviteCode: string
): Promise<string> {
  // Input validation
  if (!studentId || typeof studentId !== "string") {
    throw new Error("Invalid student ID");
  }

  if (!inviteCode || typeof inviteCode !== "string") {
    throw new Error("Invite code is required");
  }

  const normalizedCode = inviteCode.toUpperCase().trim();

  if (normalizedCode.length !== 6) {
    throw new Error("Invite code must be 6 characters");
  }

  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
    throw new Error("Invite code can only contain letters and numbers");
  }

  try {

    // Find class by invite code
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where("inviteCode", "==", normalizedCode),
      where("isArchived", "==", false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const classDoc = snapshot.docs[0];
    const classData = classDoc.data() as Class;

    // Check if self-enrollment is allowed
    if (!classData.settings.allowSelfEnrollment) {
      throw new Error("This class does not allow self-enrollment");
    }

    // Check if student is already enrolled
    if (classData.studentIds.includes(studentId)) {
      throw new Error("You are already enrolled in this class");
    }

    // Add student to class
    await addStudentToClass(classDoc.id, studentId);

    return classDoc.id;
  } catch (error: any) {
    console.error("Error joining class by code:", error);
    throw error;
  }
}

/**
 * Get class by invite code
 * @param inviteCode 6-character invite code
 * @returns Class object or null if not found
 */
export async function getClassByInviteCode(
  inviteCode: string
): Promise<Class | null> {
  try {
    const normalizedCode = inviteCode.toUpperCase().trim();

    const q = query(
      collection(db, CLASSES_COLLECTION),
      where("inviteCode", "==", normalizedCode),
      where("isArchived", "==", false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const classDoc = snapshot.docs[0];
    return { id: classDoc.id, ...classDoc.data() } as Class;
  } catch (error) {
    console.error("Error getting class by invite code:", error);
    return null;
  }
}

/**
 * Update teacher's class count in their profile
 * @param teacherId Teacher's user ID
 * @param delta Change in class count (+1 or -1)
 */
async function updateTeacherClassCount(
  teacherId: string,
  delta: number
): Promise<void> {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    const teacherDoc = await getDoc(teacherRef);

    if (teacherDoc.exists()) {
      const currentCount = teacherDoc.data().teacherProfile?.totalClasses || 0;
      const newCount = Math.max(0, currentCount + delta);

      await updateDoc(teacherRef, {
        "teacherProfile.totalClasses": newCount,
      });
    } else {
      // Initialize teacher profile if it doesn't exist
      await setDoc(
        teacherRef,
        {
          teacherProfile: {
            totalClasses: Math.max(0, delta),
            totalStudents: 0,
          },
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error("Error updating teacher class count:", error);
    // Don't throw - this is a cached count update
  }
}

/**
 * Update teacher's total student count in their profile
 * @param teacherId Teacher's user ID
 * @param delta Change in student count (+1 or -1)
 */
async function updateTeacherStudentCount(
  teacherId: string,
  delta: number
): Promise<void> {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    const teacherDoc = await getDoc(teacherRef);

    if (teacherDoc.exists()) {
      const currentCount =
        teacherDoc.data().teacherProfile?.totalStudents || 0;
      const newCount = Math.max(0, currentCount + delta);

      await updateDoc(teacherRef, {
        "teacherProfile.totalStudents": newCount,
      });
    } else {
      // Initialize teacher profile if it doesn't exist
      await setDoc(
        teacherRef,
        {
          teacherProfile: {
            totalClasses: 0,
            totalStudents: Math.max(0, delta),
          },
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error("Error updating teacher student count:", error);
    // Don't throw - this is a cached count update
  }
}
