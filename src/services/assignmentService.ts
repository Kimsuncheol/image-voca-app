/**
 * Assignment Service
 *
 * Handles all Firestore operations for assignments and submissions including:
 * - Assignment CRUD operations
 * - Submission tracking
 * - Auto-checking student progress against assignments
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Assignment,
  AssignmentWithSubmission,
  AssignmentWithSubmissions,
  CreateAssignmentData,
  Submission,
  SubmissionData,
  SubmissionStatus,
} from "../types/teacher";
import { CourseType } from "../types/vocabulary";

// Firestore collection names
const ASSIGNMENTS_COLLECTION = "assignments";
const USERS_COLLECTION = "users";
const CLASSES_COLLECTION = "classes";

/**
 * Create a new assignment
 * @param data Assignment creation data
 * @returns Created assignment ID
 */
export async function createAssignment(
  data: CreateAssignmentData
): Promise<string> {
  try {
    const now = new Date().toISOString();

    // Get class to find teacher ID and student IDs
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, data.classId));
    if (!classDoc.exists()) {
      throw new Error("Class not found");
    }

    const classData = classDoc.data();
    const teacherId = classData.teacherId;
    const studentIds = classData.studentIds || [];

    const assignmentData: Omit<Assignment, "id"> = {
      classId: data.classId,
      teacherId,
      courseId: data.courseId,
      dayNumber: data.dayNumber,
      title: data.title,
      description: data.description || "",
      dueDate: data.dueDate,
      requiredActions: data.requiredActions,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(
      collection(db, ASSIGNMENTS_COLLECTION),
      assignmentData
    );

    // Initialize submissions for all students in the class
    await initializeSubmissions(docRef.id, studentIds);

    return docRef.id;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw new Error("Failed to create assignment");
  }
}

/**
 * Initialize submissions for all students in a class
 * @param assignmentId Assignment ID
 * @param studentIds Array of student IDs
 */
async function initializeSubmissions(
  assignmentId: string,
  studentIds: string[]
): Promise<void> {
  try {
    const submissionsPromises = studentIds.map((studentId) => {
      const submissionData: Submission = {
        studentId,
        status: "not_started",
        vocabularyCompleted: false,
        quizCompleted: false,
        timeSpentMinutes: 0,
        wordsLearned: 0,
        lastUpdatedAt: new Date().toISOString(),
      };

      return setDoc(
        doc(
          db,
          ASSIGNMENTS_COLLECTION,
          assignmentId,
          "submissions",
          studentId
        ),
        submissionData
      );
    });

    await Promise.all(submissionsPromises);
  } catch (error) {
    console.error("Error initializing submissions:", error);
    // Don't throw - assignment was created successfully
  }
}

/**
 * Get all assignments for a class
 * @param classId Class ID
 * @returns Array of assignments sorted by due date
 */
export async function getClassAssignments(
  classId: string
): Promise<Assignment[]> {
  try {
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("classId", "==", classId),
      orderBy("dueDate", "desc")
    );

    const snapshot = await getDocs(q);
    const assignments: Assignment[] = [];

    snapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...doc.data() } as Assignment);
    });

    return assignments;
  } catch (error) {
    console.error("Error fetching class assignments:", error);
    throw new Error("Failed to load assignments");
  }
}

/**
 * Get all assignments for a student
 * @param studentId Student's user ID
 * @param classId Optional class ID to filter by
 * @returns Array of assignments with submission status
 */
export async function getStudentAssignments(
  studentId: string,
  classId?: string
): Promise<AssignmentWithSubmission[]> {
  try {
    // Get student's classes
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
    if (!userDoc.exists()) {
      throw new Error("Student not found");
    }

    const studentClassIds =
      userDoc.data().studentProfile?.classIds || [];

    if (studentClassIds.length === 0) {
      return [];
    }

    // Query assignments
    let q;
    if (classId) {
      q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("classId", "==", classId),
        orderBy("dueDate", "desc")
      );
    } else {
      q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where("classId", "in", studentClassIds.slice(0, 10)), // Firestore limit
        orderBy("dueDate", "desc")
      );
    }

    const snapshot = await getDocs(q);
    const assignmentsPromises = snapshot.docs.map(async (docSnapshot) => {
      const assignment = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Assignment;

      // Get submission for this student
      const submission = await getSubmission(assignment.id, studentId);

      // Get class name
      const classDoc = await getDoc(
        doc(db, CLASSES_COLLECTION, assignment.classId)
      );
      const className = classDoc.exists()
        ? classDoc.data().name
        : "Unknown Class";

      // Check if overdue
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isOverdue =
        now > dueDate && submission?.status !== "completed";

      return {
        ...assignment,
        submission,
        className,
        isOverdue,
      } as AssignmentWithSubmission;
    });

    const assignments = await Promise.all(assignmentsPromises);

    return assignments;
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    throw new Error("Failed to load assignments");
  }
}

/**
 * Get assignment details with all submissions
 * @param assignmentId Assignment ID
 * @returns Assignment with submissions
 */
export async function getAssignmentDetails(
  assignmentId: string
): Promise<AssignmentWithSubmissions> {
  try {
    const assignmentDoc = await getDoc(
      doc(db, ASSIGNMENTS_COLLECTION, assignmentId)
    );

    if (!assignmentDoc.exists()) {
      throw new Error("Assignment not found");
    }

    const assignment = {
      id: assignmentDoc.id,
      ...assignmentDoc.data(),
    } as Assignment;

    // Get all submissions
    const submissionsSnapshot = await getDocs(
      collection(
        db,
        ASSIGNMENTS_COLLECTION,
        assignmentId,
        "submissions"
      )
    );

    const submissions: Submission[] = [];
    submissionsSnapshot.forEach((doc) => {
      submissions.push(doc.data() as Submission);
    });

    // Calculate completion stats
    const completedCount = submissions.filter(
      (s) => s.status === "completed"
    ).length;
    const totalStudents = submissions.length;
    const completionPercentage =
      totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

    return {
      ...assignment,
      submissions,
      completedCount,
      totalStudents,
      completionPercentage,
    };
  } catch (error) {
    console.error("Error fetching assignment details:", error);
    throw new Error("Failed to load assignment details");
  }
}

/**
 * Update an assignment
 * @param assignmentId Assignment ID
 * @param updates Partial assignment data to update
 */
export async function updateAssignment(
  assignmentId: string,
  updates: Partial<Omit<Assignment, "id" | "classId" | "teacherId" | "createdAt">>
): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(
      doc(db, ASSIGNMENTS_COLLECTION, assignmentId),
      updateData
    );
  } catch (error) {
    console.error("Error updating assignment:", error);
    throw new Error("Failed to update assignment");
  }
}

/**
 * Delete an assignment
 * WARNING: This will delete all submissions
 * @param assignmentId Assignment ID
 */
export async function deleteAssignment(
  assignmentId: string
): Promise<void> {
  try {
    // Delete all submissions first
    const submissionsSnapshot = await getDocs(
      collection(
        db,
        ASSIGNMENTS_COLLECTION,
        assignmentId,
        "submissions"
      )
    );

    const deletePromises = submissionsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);

    // Delete the assignment
    await deleteDoc(doc(db, ASSIGNMENTS_COLLECTION, assignmentId));
  } catch (error) {
    console.error("Error deleting assignment:", error);
    throw new Error("Failed to delete assignment");
  }
}

/**
 * Get a student's submission for an assignment
 * @param assignmentId Assignment ID
 * @param studentId Student's user ID
 * @returns Submission or null if not found
 */
export async function getSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  try {
    const submissionDoc = await getDoc(
      doc(
        db,
        ASSIGNMENTS_COLLECTION,
        assignmentId,
        "submissions",
        studentId
      )
    );

    if (!submissionDoc.exists()) {
      return null;
    }

    return submissionDoc.data() as Submission;
  } catch (error) {
    console.error("Error fetching submission:", error);
    return null;
  }
}

/**
 * Submit/update an assignment submission
 * @param assignmentId Assignment ID
 * @param studentId Student's user ID
 * @param data Submission data
 */
export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  data: SubmissionData
): Promise<void> {
  try {
    const now = new Date().toISOString();

    const submissionData: Submission = {
      studentId,
      status: data.status,
      vocabularyCompleted: data.vocabularyCompleted,
      quizCompleted: data.quizCompleted,
      quizScore: data.quizScore,
      timeSpentMinutes: data.timeSpentMinutes,
      wordsLearned: data.wordsLearned,
      lastUpdatedAt: now,
      ...(data.status === "completed" && {
        completedAt: now,
        submittedAt: now,
      }),
    };

    await setDoc(
      doc(
        db,
        ASSIGNMENTS_COLLECTION,
        assignmentId,
        "submissions",
        studentId
      ),
      submissionData
    );
  } catch (error) {
    console.error("Error submitting assignment:", error);
    throw new Error("Failed to submit assignment");
  }
}

/**
 * Auto-check if a student has completed assignment requirements
 * Called when student completes vocabulary or quiz
 * @param studentId Student's user ID
 * @param courseId Course ID
 * @param day Day number
 */
export async function autoCheckSubmission(
  studentId: string,
  courseId: CourseType,
  day: number
): Promise<void> {
  try {
    // Get student's classes
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
    if (!userDoc.exists()) {
      return;
    }

    const classIds = userDoc.data().studentProfile?.classIds || [];
    if (classIds.length === 0) {
      return;
    }

    // Get student's progress for this course/day
    const courseProgress =
      userDoc.data().courseProgress?.[courseId]?.[day];
    if (!courseProgress) {
      return;
    }

    const vocabularyCompleted = courseProgress.completed || false;
    const quizCompleted = courseProgress.quizCompleted || false;
    const quizScore = courseProgress.quizScore || 0;

    // Find assignments for this course/day in student's classes
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("classId", "in", classIds.slice(0, 10)), // Firestore limit
      where("courseId", "==", courseId),
      where("dayNumber", "==", day)
    );

    const snapshot = await getDocs(q);

    // Update each matching assignment's submission
    const updatePromises = snapshot.docs.map(async (docSnapshot) => {
      const assignment = docSnapshot.data() as Assignment;
      const assignmentId = docSnapshot.id;

      // Check if requirements are met
      const reqVocab = assignment.requiredActions.completeVocabulary;
      const reqQuiz = assignment.requiredActions.completeQuiz;
      const minScore = assignment.requiredActions.minQuizScore || 0;

      const vocabMet = !reqVocab || vocabularyCompleted;
      const quizMet =
        !reqQuiz || (quizCompleted && quizScore >= minScore);

      const allRequirementsMet = vocabMet && quizMet;

      // Get current submission
      const currentSubmission = await getSubmission(
        assignmentId,
        studentId
      );

      if (!currentSubmission) {
        // Initialize if doesn't exist
        await submitAssignment(assignmentId, studentId, {
          status: allRequirementsMet
            ? "completed"
            : vocabularyCompleted || quizCompleted
              ? "in_progress"
              : "not_started",
          vocabularyCompleted,
          quizCompleted,
          quizScore,
          timeSpentMinutes: 0, // Will be calculated from dailyStats
          wordsLearned: courseProgress.wordsLearned || 0,
        });
      } else if (currentSubmission.status !== "completed") {
        // Update if not already completed
        await submitAssignment(assignmentId, studentId, {
          status: allRequirementsMet
            ? "completed"
            : "in_progress",
          vocabularyCompleted,
          quizCompleted,
          quizScore,
          timeSpentMinutes: currentSubmission.timeSpentMinutes,
          wordsLearned:
            currentSubmission.wordsLearned +
            (courseProgress.wordsLearned || 0),
        });
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error auto-checking submission:", error);
    // Don't throw - this is a background operation
  }
}

/**
 * Get count of pending assignments for a teacher
 * OPTIMIZED: Uses parallel queries to reduce latency
 * @param teacherId Teacher's user ID
 * @returns Number of assignments with incomplete submissions
 */
export async function getPendingAssignmentsCount(
  teacherId: string
): Promise<number> {
  try {
    const q = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("teacherId", "==", teacherId)
    );

    const snapshot = await getDocs(q);

    // If no assignments, return 0
    if (snapshot.empty) {
      return 0;
    }

    // Parallel fetch submissions for all assignments
    const pendingChecks = snapshot.docs.map(async (docSnapshot) => {
      try {
        // Query for incomplete submissions in this assignment
        const submissionsQuery = query(
          collection(db, ASSIGNMENTS_COLLECTION, docSnapshot.id, "submissions"),
          where("status", "!=", "completed")
        );

        const submissionsSnapshot = await getDocs(submissionsQuery);

        // If there are any incomplete submissions, this assignment is pending
        return !submissionsSnapshot.empty;
      } catch (error) {
        console.error(`Error checking submissions for assignment ${docSnapshot.id}:`, error);
        // On error, assume assignment is pending to be safe
        return true;
      }
    });

    const results = await Promise.all(pendingChecks);
    const pendingCount = results.filter(Boolean).length;

    return pendingCount;
  } catch (error) {
    console.error("Error getting pending assignments count:", error);
    // Return 0 on error rather than throwing - this is used for display only
    return 0;
  }
}
