import {
  createAssignment,
  getAssignmentById,
  getClassAssignments,
  deleteAssignment,
  autoCheckSubmission,
  getStudentSubmissions,
} from '../src/services/assignmentService';
import { db } from '../src/services/firebase';
import type { CourseType } from '../src/types/course';

// Mock Firebase
jest.mock('../src/services/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('assignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAssignment', () => {
    test('should create an assignment with all required fields', async () => {
      const mockAssignmentData = {
        classId: 'class123',
        courseId: 'TOEIC' as CourseType,
        dayNumber: 5,
        title: 'Day 5 Assignment',
        description: 'Complete vocabulary and quiz',
        dueDate: '2026-02-10T23:59:59Z',
        requiredActions: {
          completeVocabulary: true,
          completeQuiz: true,
          minQuizScore: 80,
        },
      };

      mockAddDoc.mockResolvedValue({ id: 'assignment123' });
      mockCollection.mockReturnValue('assignments-collection');

      const result = await createAssignment(mockAssignmentData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'assignments');
      expect(mockAddDoc).toHaveBeenCalledWith(
        'assignments-collection',
        expect.objectContaining({
          classId: 'class123',
          courseId: 'TOEIC',
          dayNumber: 5,
          title: 'Day 5 Assignment',
          status: 'active',
        })
      );
      expect(result).toBe('assignment123');
    });

    test('should create an assignment without optional fields', async () => {
      const mockAssignmentData = {
        classId: 'class123',
        courseId: 'TOEIC' as CourseType,
        dayNumber: 5,
        title: 'Day 5 Assignment',
        dueDate: '2026-02-10T23:59:59Z',
        requiredActions: {
          completeVocabulary: true,
          completeQuiz: false,
        },
      };

      mockAddDoc.mockResolvedValue({ id: 'assignment456' });

      const result = await createAssignment(mockAssignmentData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          description: '',
          requiredActions: {
            completeVocabulary: true,
            completeQuiz: false,
          },
        })
      );
      expect(result).toBe('assignment456');
    });
  });

  describe('getAssignmentById', () => {
    test('should return assignment data when it exists', async () => {
      const mockAssignmentData = {
        classId: 'class123',
        courseId: 'TOEIC',
        dayNumber: 5,
        title: 'Day 5 Assignment',
        status: 'active',
      };

      mockDoc.mockReturnValue('assignment-doc-ref');
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockAssignmentData,
        id: 'assignment123',
      });

      const result = await getAssignmentById('assignment123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'assignments', 'assignment123');
      expect(result).toEqual({
        id: 'assignment123',
        ...mockAssignmentData,
      });
    });

    test('should return null when assignment does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getAssignmentById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getClassAssignments', () => {
    test('should return all assignments for a class', async () => {
      const mockAssignments = [
        {
          id: 'assignment1',
          classId: 'class123',
          title: 'Assignment 1',
          status: 'active',
        },
        {
          id: 'assignment2',
          classId: 'class123',
          title: 'Assignment 2',
          status: 'active',
        },
      ];

      mockQuery.mockReturnValue('filtered-query');
      mockGetDocs.mockResolvedValue({
        docs: mockAssignments.map((assignment) => ({
          id: assignment.id,
          data: () => ({ ...assignment }),
        })),
      });

      const result = await getClassAssignments('class123');

      expect(mockWhere).toHaveBeenCalledWith('classId', '==', 'class123');
      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'active');
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Assignment 1');
    });

    test('should return empty array when no assignments exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      const result = await getClassAssignments('class456');

      expect(result).toEqual([]);
    });
  });

  describe('deleteAssignment', () => {
    test('should delete an assignment successfully', async () => {
      mockDoc.mockReturnValue('assignment-doc-ref');
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteAssignment('assignment123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'assignments', 'assignment123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('assignment-doc-ref');
    });

    test('should handle deletion errors', async () => {
      mockDeleteDoc.mockRejectedValue(new Error('Deletion failed'));

      await expect(deleteAssignment('assignment123')).rejects.toThrow(
        'Deletion failed'
      );
    });
  });

  describe('autoCheckSubmission', () => {
    test('should create submission when assignment requirements are met', async () => {
      const studentId = 'student123';
      const courseId = 'TOEIC' as CourseType;
      const dayNumber = 5;

      // Mock user document with completed vocabulary and quiz
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            courseProgress: {
              TOEIC: {
                5: {
                  completedVocabulary: true,
                  quizScore: 85,
                },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => false, // No existing submission
        });

      // Mock assignment query
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'assignment123',
            data: () => ({
              classId: 'class123',
              courseId: 'TOEIC',
              dayNumber: 5,
              requiredActions: {
                completeVocabulary: true,
                completeQuiz: true,
                minQuizScore: 80,
              },
            }),
          },
        ],
      });

      mockSetDoc.mockResolvedValue(undefined);

      await autoCheckSubmission(studentId, courseId, dayNumber);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          assignmentId: 'assignment123',
          studentId: 'student123',
          status: 'completed',
        })
      );
    });

    test('should not create submission when requirements are not met', async () => {
      const studentId = 'student123';
      const courseId = 'TOEIC' as CourseType;
      const dayNumber = 5;

      // Mock user document with incomplete progress
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          courseProgress: {
            TOEIC: {
              5: {
                completedVocabulary: true,
                quizScore: 60, // Below minimum
              },
            },
          },
        }),
      });

      // Mock assignment query
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'assignment123',
            data: () => ({
              classId: 'class123',
              courseId: 'TOEIC',
              dayNumber: 5,
              requiredActions: {
                completeVocabulary: true,
                completeQuiz: true,
                minQuizScore: 80,
              },
            }),
          },
        ],
      });

      await autoCheckSubmission(studentId, courseId, dayNumber);

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    test('should handle case when no matching assignments exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          courseProgress: {},
        }),
      });

      mockGetDocs.mockResolvedValue({
        docs: [], // No assignments
      });

      await autoCheckSubmission('student123', 'TOEIC' as CourseType, 5);

      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('getStudentSubmissions', () => {
    test('should return all submissions for a student', async () => {
      const mockSubmissions = [
        {
          id: 'submission1',
          assignmentId: 'assignment1',
          studentId: 'student123',
          status: 'completed',
        },
        {
          id: 'submission2',
          assignmentId: 'assignment2',
          studentId: 'student123',
          status: 'pending',
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockSubmissions.map((submission) => ({
          id: submission.id,
          data: () => ({ ...submission }),
        })),
      });

      const result = await getStudentSubmissions('student123');

      expect(mockWhere).toHaveBeenCalledWith('studentId', '==', 'student123');
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
    });

    test('should return empty array when student has no submissions', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      const result = await getStudentSubmissions('student456');

      expect(result).toEqual([]);
    });
  });
});
