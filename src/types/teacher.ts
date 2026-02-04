/**
 * Teacher Feature Type Definitions
 *
 * This file contains all type definitions for teacher-specific features
 * including classes, assignments, submissions, and analytics.
 */

/**
 * Course Type (re-export from vocabulary types for convenience)
 * Represents the different vocabulary courses available in the app
 */
export type CourseType =
  | "수능"
  | "TOEIC"
  | "TOEFL"
  | "TOEIC_SPEAKING"
  | "IELTS"
  | "OPIC"
  | "COLLOCATION";

/**
 * Class Settings
 * Configuration options for a class
 */
export interface ClassSettings {
  /**
   * Optional class-wide daily goal override
   * If set, overrides individual student daily goals
   */
  dailyGoal?: number;

  /**
   * Whether students can join the class via invite code
   * If false, teacher must manually add students
   */
  allowSelfEnrollment: boolean;
}

/**
 * Class
 * Represents a teacher's class with enrolled students
 */
export interface Class {
  /** Firestore document ID */
  id: string;

  /** Teacher's user ID (owner of this class) */
  teacherId: string;

  /** Class name (e.g., "TOEFL Prep 2024", "Advanced English") */
  name: string;

  /** Optional description or notes about the class */
  description?: string;

  /** Array of course IDs assigned to this class */
  courseIds: CourseType[];

  /** Array of student user IDs enrolled in this class */
  studentIds: string[];

  /** Unique 6-character invite code for students to join */
  inviteCode: string;

  /** Soft delete flag - archived classes are hidden but not deleted */
  isArchived: boolean;

  /** ISO timestamp when class was created */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;

  /** Class configuration settings */
  settings: ClassSettings;
}

/**
 * Class with full student details
 * Extended class object including full student profile data
 */
export interface ClassWithStudents extends Class {
  /** Array of full student profiles */
  students: StudentListItem[];
}

/**
 * Create Class Data
 * Input data for creating a new class
 */
export interface CreateClassData {
  /** Class name */
  name: string;

  /** Optional description */
  description?: string;

  /** Courses assigned to class */
  courseIds: CourseType[];

  /** Class settings */
  settings: ClassSettings;
}

/**
 * Required Actions for Assignment
 * Defines what students must complete to fulfill the assignment
 */
export interface RequiredActions {
  /** Student must complete vocabulary learning for the day */
  completeVocabulary: boolean;

  /** Student must complete the quiz */
  completeQuiz: boolean;

  /** Optional minimum quiz score required (0-100) */
  minQuizScore?: number;
}

/**
 * Assignment
 * Represents a teacher's assignment to a class
 */
export interface Assignment {
  /** Firestore document ID */
  id: string;

  /** Class ID this assignment belongs to */
  classId: string;

  /** Teacher ID who created the assignment */
  teacherId: string;

  /** Course ID for this assignment */
  courseId: CourseType;

  /** Day number within the course (1-30) */
  dayNumber: number;

  /** Assignment title (e.g., "Week 1 Vocabulary Review") */
  title: string;

  /** Optional instructions or notes for students */
  description?: string;

  /** ISO timestamp of due date */
  dueDate: string;

  /** Optional target score (legacy field, use minQuizScore in requiredActions) */
  targetScore?: number;

  /** Required actions students must complete */
  requiredActions: RequiredActions;

  /** ISO timestamp when created */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * Assignment with Submissions
 * Extended assignment object including all student submissions
 */
export interface AssignmentWithSubmissions extends Assignment {
  /** Array of all submissions for this assignment */
  submissions: Submission[];

  /** Number of students who completed the assignment */
  completedCount: number;

  /** Total number of students in the class */
  totalStudents: number;

  /** Completion percentage (0-100) */
  completionPercentage: number;
}

/**
 * Assignment with User's Submission
 * Assignment object with the current user's submission attached
 * Used for student views
 */
export interface AssignmentWithSubmission extends Assignment {
  /** Current user's submission (null if not started) */
  submission: Submission | null;

  /** Class name for display */
  className: string;

  /** Whether assignment is overdue */
  isOverdue: boolean;
}

/**
 * Create Assignment Data
 * Input data for creating a new assignment
 */
export interface CreateAssignmentData {
  /** Class ID to assign to */
  classId: string;

  /** Course for the assignment */
  courseId: CourseType;

  /** Day number in the course */
  dayNumber: number;

  /** Assignment title */
  title: string;

  /** Optional description */
  description?: string;

  /** Due date */
  dueDate: string;

  /** Required completion actions */
  requiredActions: RequiredActions;
}

/**
 * Submission Status
 * Represents the current status of a student's assignment submission
 */
export type SubmissionStatus = "not_started" | "in_progress" | "completed";

/**
 * Submission
 * Represents a student's submission for an assignment
 * Stored as a subcollection under assignments/{assignmentId}/submissions
 */
export interface Submission {
  /** Student's user ID */
  studentId: string;

  /** Current submission status */
  status: SubmissionStatus;

  /** ISO timestamp when completed (null if not completed) */
  completedAt?: string;

  /** Whether student completed vocabulary learning */
  vocabularyCompleted: boolean;

  /** Whether student completed the quiz */
  quizCompleted: boolean;

  /** Quiz score (0-100), null if not completed */
  quizScore?: number;

  /** Total time spent on this assignment in minutes */
  timeSpentMinutes: number;

  /** Number of words learned in this assignment */
  wordsLearned: number;

  /** ISO timestamp when student submitted (null if not submitted) */
  submittedAt?: string;

  /** ISO timestamp of last update to this submission */
  lastUpdatedAt: string;
}

/**
 * Submission Data
 * Input data for creating/updating a submission
 */
export interface SubmissionData {
  /** Submission status */
  status: SubmissionStatus;

  /** Whether vocabulary was completed */
  vocabularyCompleted: boolean;

  /** Whether quiz was completed */
  quizCompleted: boolean;

  /** Quiz score if quiz completed */
  quizScore?: number;

  /** Time spent in minutes */
  timeSpentMinutes: number;

  /** Words learned count */
  wordsLearned: number;
}

/**
 * Student List Item
 * Lightweight student profile for list views
 */
export interface StudentListItem {
  /** User ID */
  uid: string;

  /** Display name */
  displayName: string;

  /** Profile photo URL */
  photoURL?: string;

  /** Email address */
  email: string;

  /** Current streak count */
  currentStreak: number;

  /** Total words learned */
  wordsLearned: number;

  /** ISO date of last active session */
  lastActiveDate: string;

  /** Optional class-specific progress percentage (0-100) */
  classProgress?: number;
}

/**
 * Student Profile
 * Full student profile with detailed stats
 */
export interface StudentProfile extends StudentListItem {
  /** Student's daily goal */
  dailyGoal: number;

  /** Longest streak achieved */
  longestStreak: number;

  /** Total quiz answers */
  totalQuizAnswers: number;

  /** Total correct answers */
  totalCorrectAnswers: number;

  /** Quiz accuracy percentage */
  accuracy: number;

  /** Classes student is enrolled in */
  classIds: string[];

  /** Teacher IDs student is connected to */
  teacherIds: string[];
}

/**
 * Class Analytics Period
 * Time period for analytics calculations
 */
export type AnalyticsPeriod = "week" | "month" | "all";

/**
 * Trend Data Point
 * Single data point for trend charts
 */
export interface TrendDataPoint {
  /** ISO date for this data point */
  date: string;

  /** Numeric value for this data point */
  value: number;
}

/**
 * Class Analytics
 * Aggregated analytics for a class
 */
export interface ClassAnalytics {
  /** Class ID */
  classId: string;

  /** Time period for these analytics */
  period: "week" | "month";

  /** Total number of students in class */
  totalStudents: number;

  /** Number of active students (studied in period) */
  activeStudents: number;

  /** Average words learned per student */
  avgWordsLearned: number;

  /** Average quiz accuracy (0-100) */
  avgAccuracy: number;

  /** Average study time in minutes per student */
  avgTimeSpent: number;

  /** Assignment completion rate (0-100) */
  completionRate: number;

  /** Top performing students */
  topPerformers: StudentListItem[];

  /** Students who need attention (low activity, failing) */
  needsAttention: StudentAlert[];

  /** Trend data for charts */
  trendData: TrendDataPoint[];
}

/**
 * Student Analytics
 * Detailed analytics for an individual student
 */
export interface StudentAnalytics {
  /** Student ID */
  studentId: string;

  /** Student display name */
  displayName: string;

  /** Student email */
  email: string;

  /** Student photo URL */
  photoURL?: string;

  /** Total words learned */
  totalWordsLearned: number;

  /** Total study time in minutes */
  totalTimeSpent: number;

  /** Average quiz accuracy (0-100) */
  avgAccuracy: number;

  /** Current streak */
  currentStreak: number;

  /** Longest streak */
  longestStreak: number;

  /** Number of days completed */
  daysCompleted: number;

  /** Last active date */
  lastActiveDate: string;

  /** Activity trend data (last 30 days) */
  activityTrend: TrendDataPoint[];

  /** Course progress data */
  courseProgress: Record<string, Record<string, any>>;
}

/**
 * Daily Activity
 * Student's activity for a single day (for heatmap visualization)
 */
export interface DailyActivity {
  /** ISO date (YYYY-MM-DD) */
  date: string;

  /** Words learned on this day */
  wordsLearned: number;

  /** Time spent in minutes */
  timeSpentMinutes: number;

  /** Whether student was active (studied) on this day */
  wasActive: boolean;
}

/**
 * Student Course Progress
 * Student's progress in a specific course
 */
export interface StudentCourseProgress {
  /** Course ID */
  courseId: CourseType;

  /** Course name for display */
  courseName: string;

  /** Number of days completed */
  daysCompleted: number;

  /** Total number of days in course */
  totalDays: number;

  /** Completion percentage (0-100) */
  completionPercentage: number;

  /** Average quiz score for completed days */
  avgQuizScore: number;
}

/**
 * Assignment Analytics
 * Analytics for a specific assignment
 */
export interface AssignmentAnalytics {
  /** Assignment ID */
  assignmentId: string;

  /** Number of submissions received */
  submissionsCount: number;

  /** Number of completed submissions */
  completedCount: number;

  /** Completion rate (0-100) */
  completionRate: number;

  /** Average quiz score */
  avgQuizScore: number;

  /** Average time spent in minutes */
  avgTimeSpent: number;

  /** Average words learned */
  avgWordsLearned: number;

  /** Submissions by status breakdown */
  statusBreakdown: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };

  /** ISO timestamp when calculated */
  calculatedAt: string;
}

/**
 * Activity Item
 * Single activity event in recent activity feed
 */
export interface ActivityItem {
  /** Activity ID */
  id: string;

  /** Type of activity */
  type:
    | "assignment_completed"
    | "quiz_passed"
    | "quiz_failed"
    | "streak_milestone"
    | "class_joined";

  /** Student ID who performed the activity */
  studentId: string;

  /** Student display name */
  studentName: string;

  /** Student photo URL */
  studentPhoto?: string;

  /** Activity description */
  description: string;

  /** ISO timestamp when activity occurred */
  timestamp: string;

  /** Optional class ID */
  classId?: string;

  /** Optional assignment ID */
  assignmentId?: string;

  /** Optional metadata (score, streak count, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Teacher Overview
 * High-level overview stats for a teacher's dashboard
 */
export interface TeacherOverview {
  /** Total number of classes */
  totalClasses: number;

  /** Total number of students across all classes */
  totalStudents: number;

  /** Number of active students (studied recently) */
  activeStudents: number;

  /** Number of pending (not completed) assignments */
  pendingAssignments: number;

  /** Recent student activity feed */
  recentActivity: ActivityItem[];

  /** ISO timestamp when calculated */
  calculatedAt: string;
}

/**
 * Student Alert
 * Alert for a student needing attention
 */
export interface StudentAlert extends StudentListItem {
  /** Alert type */
  alertType: "inactive" | "streak_lost" | "low_performance";

  /** Human-readable alert message */
  alertMessage: string;

  /** Alert severity */
  severity: "low" | "medium" | "high";
}

/**
 * Class Progress Summary
 * Aggregated progress for all students in a class
 */
export interface ClassProgressSummary {
  /** Class ID */
  classId: string;

  /** Optional course ID (if filtering by course) */
  courseId?: CourseType;

  /** Total students */
  totalStudents: number;

  /** Students who have started */
  studentsStarted: number;

  /** Students who have completed all days */
  studentsCompleted: number;

  /** Overall completion percentage */
  overallCompletion: number;

  /** Per-day completion breakdown */
  dayCompletions: {
    day: number;
    completedCount: number;
    percentage: number;
  }[];

  /** ISO timestamp when calculated */
  calculatedAt: string;
}

/**
 * Comparison Data
 * Comparison of a student's performance against class averages
 */
export interface ComparisonData {
  /** Student ID */
  studentId: string;

  /** Class ID */
  classId: string;

  /** Student's words learned */
  studentWordsLearned: number;

  /** Class average words learned */
  classAvgWordsLearned: number;

  /** Student's accuracy */
  studentAccuracy: number;

  /** Class average accuracy */
  classAvgAccuracy: number;

  /** Student's time spent */
  studentTimeSpent: number;

  /** Class average time spent */
  classAvgTimeSpent: number;

  /** Student's percentile rank in class (0-100) */
  percentileRank: number;

  /** ISO timestamp when calculated */
  calculatedAt: string;
}
