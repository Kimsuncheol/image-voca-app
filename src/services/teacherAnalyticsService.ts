/**
 * Teacher Analytics Service
 *
 * Provides analytics and reporting for teachers including:
 * - Class-wide performance metrics
 * - Student progress tracking
 * - Assignment completion statistics
 * - Students needing attention alerts
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ClassAnalytics,
  StudentAnalytics,
  StudentAlert,
  TeacherOverview,
  TrendDataPoint,
} from "../types/teacher";

const USERS_COLLECTION = "users";
const CLASSES_COLLECTION = "classes";
const ASSIGNMENTS_COLLECTION = "assignments";

/**
 * Get teacher overview statistics
 * @param teacherId Teacher's user ID
 * @returns Overview with total classes, students, and pending assignments
 */
export async function getTeacherOverview(
  teacherId: string
): Promise<TeacherOverview> {
  try {
    // Get teacher's classes
    const classesQuery = query(
      collection(db, CLASSES_COLLECTION),
      where("teacherId", "==", teacherId),
      where("isArchived", "==", false)
    );
    const classesSnapshot = await getDocs(classesQuery);
    const totalClasses = classesSnapshot.size;

    // Get all unique students across classes
    const studentIds = new Set<string>();
    classesSnapshot.forEach((doc) => {
      const classData = doc.data();
      classData.studentIds?.forEach((id: string) => studentIds.add(id));
    });
    const totalStudents = studentIds.size;

    // Get active students (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    let activeStudents = 0;
    const studentChecks = Array.from(studentIds).map(async (studentId) => {
      try {
        const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          const lastActive = data.lastActiveDate || "";
          if (lastActive >= sevenDaysAgoISO) {
            return true;
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    });
    const results = await Promise.all(studentChecks);
    activeStudents = results.filter(Boolean).length;

    // Get pending assignments count
    const assignmentsQuery = query(
      collection(db, ASSIGNMENTS_COLLECTION),
      where("teacherId", "==", teacherId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const pendingChecks = assignmentsSnapshot.docs.map(async (docSnapshot) => {
      try {
        const submissionsQuery = query(
          collection(db, ASSIGNMENTS_COLLECTION, docSnapshot.id, "submissions"),
          where("status", "!=", "completed")
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        return !submissionsSnapshot.empty;
      } catch (error) {
        return false;
      }
    });
    const pendingResults = await Promise.all(pendingChecks);
    const pendingAssignments = pendingResults.filter(Boolean).length;

    return {
      totalClasses,
      totalStudents,
      activeStudents,
      pendingAssignments,
      recentActivity: [], // Will be populated from daily stats
    };
  } catch (error) {
    console.error("Error getting teacher overview:", error);
    throw new Error("Failed to load teacher overview");
  }
}

/**
 * Get class analytics for a specific period
 * @param classId Class ID
 * @param period Time period ('week' or 'month')
 * @returns Class analytics with performance metrics
 */
export async function getClassAnalytics(
  classId: string,
  period: "week" | "month" = "week"
): Promise<ClassAnalytics> {
  try {
    // Get class details
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (!classDoc.exists()) {
      throw new Error("Class not found");
    }

    const classData = classDoc.data();
    const studentIds = classData.studentIds || [];
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return {
        classId,
        period,
        totalStudents: 0,
        activeStudents: 0,
        avgWordsLearned: 0,
        avgAccuracy: 0,
        avgTimeSpent: 0,
        completionRate: 0,
        topPerformers: [],
        needsAttention: [],
        trendData: [],
      };
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setDate(now.getDate() - 30);
    }
    const startDateISO = startDate.toISOString();

    // Fetch all student data in parallel
    const studentDataPromises = studentIds.map(async (studentId: string) => {
      try {
        const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
        if (studentDoc.exists()) {
          return { id: studentId, data: studentDoc.data() };
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const studentDataResults = await Promise.all(studentDataPromises);
    const validStudents = studentDataResults.filter((s) => s !== null);

    // Calculate metrics
    let activeStudents = 0;
    let totalWordsLearned = 0;
    let totalAccuracy = 0;
    let totalTimeSpent = 0;
    let studentsWithProgress = 0;

    const studentMetrics = validStudents.map((student) => {
      const data = student!.data;
      const dailyStats = data.dailyStats || [];

      // Filter stats within period
      const periodStats = dailyStats.filter(
        (stat: any) => stat.date >= startDateISO
      );

      const wordsLearned = periodStats.reduce(
        (sum: number, stat: any) => sum + (stat.wordsLearned || 0),
        0
      );
      const timeSpent = periodStats.reduce(
        (sum: number, stat: any) => sum + (stat.timeSpent || 0),
        0
      );

      // Calculate accuracy from course progress
      const courseProgress = data.courseProgress || {};
      let totalQuizzes = 0;
      let totalScore = 0;
      Object.values(courseProgress).forEach((course: any) => {
        Object.values(course).forEach((day: any) => {
          if (day.quizCompleted && day.quizScore !== undefined) {
            totalQuizzes++;
            totalScore += day.quizScore;
          }
        });
      });
      const accuracy = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;

      // Check if active (has activity in period)
      const isActive = periodStats.length > 0;
      if (isActive) {
        activeStudents++;
        totalWordsLearned += wordsLearned;
        totalTimeSpent += timeSpent;
        if (totalQuizzes > 0) {
          totalAccuracy += accuracy;
          studentsWithProgress++;
        }
      }

      return {
        uid: student!.id,
        displayName: data.displayName || "Unknown",
        photoURL: data.photoURL,
        email: data.email || "",
        currentStreak: data.currentStreak || 0,
        wordsLearned,
        lastActiveDate: data.lastActiveDate || "",
        classProgress: accuracy,
      };
    });

    const avgWordsLearned =
      activeStudents > 0 ? totalWordsLearned / activeStudents : 0;
    const avgAccuracy =
      studentsWithProgress > 0 ? totalAccuracy / studentsWithProgress : 0;
    const avgTimeSpent =
      activeStudents > 0 ? totalTimeSpent / activeStudents : 0;
    const completionRate = (activeStudents / totalStudents) * 100;

    // Top performers (by words learned)
    const topPerformers = studentMetrics
      .filter((s) => s.wordsLearned > 0)
      .sort((a, b) => b.wordsLearned - a.wordsLearned)
      .slice(0, 5);

    // Students needing attention
    const needsAttention = await getStudentsNeedingAttention(classId);

    // Generate trend data (last 7 or 30 days)
    const days = period === "week" ? 7 : 30;
    const trendData: TrendDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      let dayWords = 0;
      validStudents.forEach((student) => {
        const dailyStats = student!.data.dailyStats || [];
        const dayStat = dailyStats.find(
          (stat: any) => stat.date.startsWith(dateStr)
        );
        if (dayStat) {
          dayWords += dayStat.wordsLearned || 0;
        }
      });

      trendData.push({
        date: dateStr,
        value: dayWords,
      });
    }

    return {
      classId,
      period,
      totalStudents,
      activeStudents,
      avgWordsLearned: Math.round(avgWordsLearned),
      avgAccuracy: Math.round(avgAccuracy),
      avgTimeSpent: Math.round(avgTimeSpent),
      completionRate: Math.round(completionRate),
      topPerformers,
      needsAttention: needsAttention.slice(0, 5),
      trendData,
    };
  } catch (error) {
    console.error("Error getting class analytics:", error);
    throw new Error("Failed to load class analytics");
  }
}

/**
 * Get individual student analytics
 * @param studentId Student's user ID
 * @param classId Optional class ID to filter by
 * @returns Student analytics with progress details
 */
export async function getStudentAnalytics(
  studentId: string,
  classId?: string
): Promise<StudentAnalytics> {
  try {
    const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
    if (!studentDoc.exists()) {
      throw new Error("Student not found");
    }

    const data = studentDoc.data();
    const dailyStats = data.dailyStats || [];
    const courseProgress = data.courseProgress || {};

    // Calculate total words learned
    const totalWordsLearned = dailyStats.reduce(
      (sum: number, stat: any) => sum + (stat.wordsLearned || 0),
      0
    );

    // Calculate total time spent (in minutes)
    const totalTimeSpent = dailyStats.reduce(
      (sum: number, stat: any) => sum + (stat.timeSpent || 0),
      0
    );

    // Calculate average accuracy
    let totalQuizzes = 0;
    let totalScore = 0;
    Object.values(courseProgress).forEach((course: any) => {
      Object.values(course).forEach((day: any) => {
        if (day.quizCompleted && day.quizScore !== undefined) {
          totalQuizzes++;
          totalScore += day.quizScore;
        }
      });
    });
    const avgAccuracy = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;

    // Calculate days completed
    let daysCompleted = 0;
    Object.values(courseProgress).forEach((course: any) => {
      Object.values(course).forEach((day: any) => {
        if (day.completed) {
          daysCompleted++;
        }
      });
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentStats = dailyStats.filter(
      (stat: any) => new Date(stat.date) >= thirtyDaysAgo
    );

    // Calculate activity trend
    const activityTrend: TrendDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayStat = dailyStats.find((stat: any) =>
        stat.date.startsWith(dateStr)
      );
      activityTrend.push({
        date: dateStr,
        value: dayStat?.wordsLearned || 0,
      });
    }

    return {
      studentId,
      displayName: data.displayName || "Unknown",
      email: data.email || "",
      photoURL: data.photoURL,
      totalWordsLearned,
      totalTimeSpent,
      avgAccuracy: Math.round(avgAccuracy),
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      daysCompleted,
      lastActiveDate: data.lastActiveDate || "",
      activityTrend,
      courseProgress,
    };
  } catch (error) {
    console.error("Error getting student analytics:", error);
    throw new Error("Failed to load student analytics");
  }
}

/**
 * Get students needing attention in a class
 * Identifies students with low activity, broken streaks, or low performance
 * @param classId Class ID
 * @returns Array of student alerts
 */
export async function getStudentsNeedingAttention(
  classId: string
): Promise<StudentAlert[]> {
  try {
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    if (!classDoc.exists()) {
      return [];
    }

    const classData = classDoc.data();
    const studentIds = classData.studentIds || [];

    if (studentIds.length === 0) {
      return [];
    }

    const alerts: StudentAlert[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Check each student
    const studentChecks = studentIds.map(async (studentId: string) => {
      try {
        const studentDoc = await getDoc(doc(db, USERS_COLLECTION, studentId));
        if (!studentDoc.exists()) {
          return null;
        }

        const data = studentDoc.data();
        const lastActive = new Date(data.lastActiveDate || 0);
        const currentStreak = data.currentStreak || 0;

        // Check for inactivity (no activity in 7 days)
        if (lastActive < sevenDaysAgo) {
          return {
            uid: studentId,
            displayName: data.displayName || "Unknown",
            photoURL: data.photoURL,
            email: data.email || "",
            alertType: "inactive" as const,
            alertMessage: `No activity for ${Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))} days`,
            severity: "high" as const,
            lastActiveDate: data.lastActiveDate || "",
            currentStreak: currentStreak,
            wordsLearned: 0,
          };
        }

        // Check for broken streak (streak was > 0, now 0)
        if (data.longestStreak > 7 && currentStreak === 0) {
          return {
            uid: studentId,
            displayName: data.displayName || "Unknown",
            photoURL: data.photoURL,
            email: data.email || "",
            alertType: "streak_lost" as const,
            alertMessage: `Lost ${data.longestStreak}-day streak`,
            severity: "medium" as const,
            lastActiveDate: data.lastActiveDate || "",
            currentStreak: currentStreak,
            wordsLearned: 0,
          };
        }

        // Check for low quiz performance (avg < 60%)
        const courseProgress = data.courseProgress || {};
        let totalQuizzes = 0;
        let totalScore = 0;
        Object.values(courseProgress).forEach((course: any) => {
          Object.values(course).forEach((day: any) => {
            if (day.quizCompleted && day.quizScore !== undefined) {
              totalQuizzes++;
              totalScore += day.quizScore;
            }
          });
        });

        if (totalQuizzes >= 3 && totalScore / totalQuizzes < 60) {
          return {
            uid: studentId,
            displayName: data.displayName || "Unknown",
            photoURL: data.photoURL,
            email: data.email || "",
            alertType: "low_performance" as const,
            alertMessage: `Low quiz average: ${Math.round(totalScore / totalQuizzes)}%`,
            severity: "medium" as const,
            lastActiveDate: data.lastActiveDate || "",
            currentStreak: currentStreak,
            wordsLearned: 0,
          };
        }

        return null;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(studentChecks);
    return results.filter((alert): alert is StudentAlert => alert !== null);
  } catch (error) {
    console.error("Error getting students needing attention:", error);
    return [];
  }
}
