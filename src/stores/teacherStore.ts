/**
 * Teacher Store
 *
 * Zustand store for teacher-specific state management including:
 * - Classes management
 * - Assignments tracking
 * - Student data
 * - Analytics and overview
 */

import { create } from "zustand";
import {
  Assignment,
  AssignmentWithSubmissions,
  Class,
  ClassWithStudents,
  CreateAssignmentData,
  CreateClassData,
  StudentListItem,
  TeacherOverview,
} from "../types/teacher";
import {
  addStudentToClass,
  archiveClass,
  createClass,
  getClassDetails,
  getTeacherClasses,
  removeStudentFromClass,
  updateClass,
} from "../services/classService";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentDetails,
  getClassAssignments,
  getPendingAssignmentsCount,
  updateAssignment,
} from "../services/assignmentService";

interface TeacherState {
  // Classes state
  classes: Class[];
  currentClass: ClassWithStudents | null;
  loadingClasses: boolean;
  classesError: string | null;

  // Assignments state
  assignments: Assignment[];
  currentAssignment: AssignmentWithSubmissions | null;
  loadingAssignments: boolean;
  assignmentsError: string | null;

  // Students state
  classStudents: StudentListItem[];
  loadingStudents: boolean;
  studentsError: string | null;

  // Overview state
  teacherOverview: TeacherOverview | null;
  loadingOverview: boolean;
  overviewError: string | null;

  // Class actions
  fetchClasses: (teacherId: string, includeArchived?: boolean) => Promise<void>;
  fetchClassDetails: (classId: string) => Promise<void>;
  createNewClass: (teacherId: string, data: CreateClassData) => Promise<string>;
  updateClassData: (
    classId: string,
    updates: Partial<Omit<Class, "id" | "teacherId" | "createdAt">>
  ) => Promise<void>;
  archiveClassById: (classId: string) => Promise<void>;
  addStudent: (classId: string, studentId: string) => Promise<void>;
  removeStudent: (classId: string, studentId: string) => Promise<void>;
  clearCurrentClass: () => void;

  // Assignment actions
  fetchClassAssignments: (classId: string) => Promise<void>;
  fetchAssignmentDetails: (assignmentId: string) => Promise<void>;
  createNewAssignment: (data: CreateAssignmentData) => Promise<string>;
  updateAssignmentData: (
    assignmentId: string,
    updates: Partial<
      Omit<Assignment, "id" | "classId" | "teacherId" | "createdAt">
    >
  ) => Promise<void>;
  deleteAssignmentById: (assignmentId: string) => Promise<void>;
  clearCurrentAssignment: () => void;

  // Overview actions
  fetchTeacherOverview: (teacherId: string) => Promise<void>;

  // Reset actions
  resetTeacherState: () => void;
}

const initialState = {
  // Classes
  classes: [],
  currentClass: null,
  loadingClasses: false,
  classesError: null,

  // Assignments
  assignments: [],
  currentAssignment: null,
  loadingAssignments: false,
  assignmentsError: null,

  // Students
  classStudents: [],
  loadingStudents: false,
  studentsError: null,

  // Overview
  teacherOverview: null,
  loadingOverview: false,
  overviewError: null,
};

export const useTeacherStore = create<TeacherState>((set, get) => ({
  ...initialState,

  // ============================================================================
  // CLASS ACTIONS
  // ============================================================================

  fetchClasses: async (teacherId: string, includeArchived = false) => {
    set({ loadingClasses: true, classesError: null });
    try {
      const classes = await getTeacherClasses(teacherId, includeArchived);
      set({ classes, loadingClasses: false });
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      set({
        classesError: error.message || "Failed to load classes",
        loadingClasses: false,
      });
    }
  },

  fetchClassDetails: async (classId: string) => {
    set({ loadingClasses: true, classesError: null, loadingStudents: true });
    try {
      const classDetails = await getClassDetails(classId);
      set({
        currentClass: classDetails,
        classStudents: classDetails.students,
        loadingClasses: false,
        loadingStudents: false,
      });
    } catch (error: any) {
      console.error("Error fetching class details:", error);
      set({
        classesError: error.message || "Failed to load class details",
        loadingClasses: false,
        loadingStudents: false,
      });
    }
  },

  createNewClass: async (teacherId: string, data: CreateClassData) => {
    set({ loadingClasses: true, classesError: null });
    try {
      const classId = await createClass(teacherId, data);
      // Refresh class list
      await get().fetchClasses(teacherId);
      return classId;
    } catch (error: any) {
      console.error("Error creating class:", error);
      set({
        classesError: error.message || "Failed to create class",
        loadingClasses: false,
      });
      throw error;
    }
  },

  updateClassData: async (classId, updates) => {
    set({ loadingClasses: true, classesError: null });
    try {
      await updateClass(classId, updates);
      // Refresh current class if it's the one being updated
      if (get().currentClass?.id === classId) {
        await get().fetchClassDetails(classId);
      }
      set({ loadingClasses: false });
    } catch (error: any) {
      console.error("Error updating class:", error);
      set({
        classesError: error.message || "Failed to update class",
        loadingClasses: false,
      });
      throw error;
    }
  },

  archiveClassById: async (classId: string) => {
    set({ loadingClasses: true, classesError: null });
    try {
      await archiveClass(classId);
      // Remove from classes list
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== classId),
        loadingClasses: false,
      }));
      // Clear current class if it was archived
      if (get().currentClass?.id === classId) {
        set({ currentClass: null });
      }
    } catch (error: any) {
      console.error("Error archiving class:", error);
      set({
        classesError: error.message || "Failed to archive class",
        loadingClasses: false,
      });
      throw error;
    }
  },

  addStudent: async (classId: string, studentId: string) => {
    set({ loadingStudents: true, studentsError: null });
    try {
      await addStudentToClass(classId, studentId);
      // Refresh class details
      await get().fetchClassDetails(classId);
    } catch (error: any) {
      console.error("Error adding student:", error);
      set({
        studentsError: error.message || "Failed to add student",
        loadingStudents: false,
      });
      throw error;
    }
  },

  removeStudent: async (classId: string, studentId: string) => {
    set({ loadingStudents: true, studentsError: null });
    try {
      await removeStudentFromClass(classId, studentId);
      // Refresh class details
      await get().fetchClassDetails(classId);
    } catch (error: any) {
      console.error("Error removing student:", error);
      set({
        studentsError: error.message || "Failed to remove student",
        loadingStudents: false,
      });
      throw error;
    }
  },

  clearCurrentClass: () => {
    set({ currentClass: null, classStudents: [] });
  },

  // ============================================================================
  // ASSIGNMENT ACTIONS
  // ============================================================================

  fetchClassAssignments: async (classId: string) => {
    set({ loadingAssignments: true, assignmentsError: null });
    try {
      const assignments = await getClassAssignments(classId);
      set({ assignments, loadingAssignments: false });
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      set({
        assignmentsError: error.message || "Failed to load assignments",
        loadingAssignments: false,
      });
    }
  },

  fetchAssignmentDetails: async (assignmentId: string) => {
    set({ loadingAssignments: true, assignmentsError: null });
    try {
      const assignmentDetails = await getAssignmentDetails(assignmentId);
      set({
        currentAssignment: assignmentDetails,
        loadingAssignments: false,
      });
    } catch (error: any) {
      console.error("Error fetching assignment details:", error);
      set({
        assignmentsError: error.message || "Failed to load assignment details",
        loadingAssignments: false,
      });
    }
  },

  createNewAssignment: async (data: CreateAssignmentData) => {
    set({ loadingAssignments: true, assignmentsError: null });
    try {
      const assignmentId = await createAssignment(data);
      // Refresh assignments list for the class
      await get().fetchClassAssignments(data.classId);
      return assignmentId;
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      set({
        assignmentsError: error.message || "Failed to create assignment",
        loadingAssignments: false,
      });
      throw error;
    }
  },

  updateAssignmentData: async (assignmentId, updates) => {
    set({ loadingAssignments: true, assignmentsError: null });
    try {
      await updateAssignment(assignmentId, updates);
      // Refresh current assignment if it's the one being updated
      if (get().currentAssignment?.id === assignmentId) {
        await get().fetchAssignmentDetails(assignmentId);
      }
      set({ loadingAssignments: false });
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      set({
        assignmentsError: error.message || "Failed to update assignment",
        loadingAssignments: false,
      });
      throw error;
    }
  },

  deleteAssignmentById: async (assignmentId: string) => {
    set({ loadingAssignments: true, assignmentsError: null });
    try {
      await deleteAssignment(assignmentId);
      // Remove from assignments list
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== assignmentId),
        loadingAssignments: false,
      }));
      // Clear current assignment if it was deleted
      if (get().currentAssignment?.id === assignmentId) {
        set({ currentAssignment: null });
      }
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      set({
        assignmentsError: error.message || "Failed to delete assignment",
        loadingAssignments: false,
      });
      throw error;
    }
  },

  clearCurrentAssignment: () => {
    set({ currentAssignment: null });
  },

  // ============================================================================
  // OVERVIEW ACTIONS
  // ============================================================================

  fetchTeacherOverview: async (teacherId: string) => {
    set({ loadingOverview: true, overviewError: null });
    try {
      // Fetch classes for total counts
      const classes = await getTeacherClasses(teacherId, false);
      const totalClasses = classes.length;
      const totalStudents = classes.reduce(
        (sum, c) => sum + c.studentIds.length,
        0
      );

      // Get pending assignments count
      const pendingAssignments = await getPendingAssignmentsCount(teacherId);

      // For now, we'll set activeStudents to totalStudents
      // In Phase 3, we'll implement proper analytics to calculate this
      const activeStudents = totalStudents;

      const overview: TeacherOverview = {
        totalClasses,
        totalStudents,
        activeStudents,
        pendingAssignments,
        recentActivity: [], // Will be implemented in Phase 3
        calculatedAt: new Date().toISOString(),
      };

      set({ teacherOverview: overview, loadingOverview: false });
    } catch (error: any) {
      console.error("Error fetching teacher overview:", error);
      set({
        overviewError: error.message || "Failed to load overview",
        loadingOverview: false,
      });
    }
  },

  // ============================================================================
  // RESET ACTIONS
  // ============================================================================

  resetTeacherState: () => {
    set(initialState);
  },
}));
