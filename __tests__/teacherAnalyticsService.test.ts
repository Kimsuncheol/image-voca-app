import {
  getTeacherOverview,
  getClassAnalytics,
  getStudentAnalytics,
  getStudentsNeedingAttention,
} from '../src/services/teacherAnalyticsService';
import { db } from '../src/services/firebase';

// Mock Firebase
jest.mock('../src/services/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
}));

describe('teacherAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeacherOverview', () => {
    test('should return overview statistics for a teacher', async () => {
      const mockClasses = [
        {
          id: 'class1',
          name: 'English 101',
          studentIds: ['student1', 'student2', 'student3'],
        },
        {
          id: 'class2',
          name: 'English 102',
          studentIds: ['student2', 'student4'],
        },
      ];

      // Mock teacher's classes
      mockGetDocs.mockResolvedValueOnce({
        docs: mockClasses.map((cls) => ({
          id: cls.id,
          data: () => cls,
        })),
      });

      // Mock student documents for active check
      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            lastActiveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            lastActiveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            lastActiveDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (inactive)
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            lastActiveDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          }),
        });

      const result = await getTeacherOverview('teacher123');

      expect(result.totalClasses).toBe(2);
      expect(result.totalStudents).toBe(4); // Unique students
      expect(result.activeStudents).toBe(3); // Active in last 7 days
      expect(result.completionRate).toBeGreaterThanOrEqual(0);
      expect(result.avgQuizScore).toBeGreaterThanOrEqual(0);
    });

    test('should return zero values when teacher has no classes', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
      });

      const result = await getTeacherOverview('teacher456');

      expect(result.totalClasses).toBe(0);
      expect(result.totalStudents).toBe(0);
      expect(result.activeStudents).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.avgQuizScore).toBe(0);
    });
  });

  describe('getClassAnalytics', () => {
    test('should return analytics for a class within specified period', async () => {
      const mockClass = {
        id: 'class123',
        name: 'English 101',
        studentIds: ['student1', 'student2'],
      };

      // Mock class document
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockClass,
      });

      // Mock student documents
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      mockGetDoc
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            uid: 'student1',
            displayName: 'Alice',
            email: 'alice@test.com',
            lastActiveDate: today.toISOString(),
            dailyStats: [
              {
                date: today.toISOString().split('T')[0],
                wordsLearned: 10,
                timeSpent: 30,
              },
              {
                date: weekAgo.toISOString().split('T')[0],
                wordsLearned: 15,
                timeSpent: 45,
              },
            ],
            courseProgress: {
              TOEIC: {
                1: { completedVocabulary: true, quizScore: 85 },
                2: { completedVocabulary: true, quizScore: 90 },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            uid: 'student2',
            displayName: 'Bob',
            email: 'bob@test.com',
            lastActiveDate: today.toISOString(),
            dailyStats: [
              {
                date: today.toISOString().split('T')[0],
                wordsLearned: 20,
                timeSpent: 60,
              },
            ],
            courseProgress: {
              TOEIC: {
                1: { completedVocabulary: true, quizScore: 75 },
              },
            },
          }),
        });

      const result = await getClassAnalytics('class123', 'week');

      expect(result.classId).toBe('class123');
      expect(result.period).toBe('week');
      expect(result.totalStudents).toBe(2);
      expect(result.activeStudents).toBe(2);
      expect(result.totalWords).toBeGreaterThan(0);
      expect(result.avgAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.topPerformers).toBeDefined();
      expect(result.needsAttention).toBeDefined();
    });

    test('should throw error when class does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(getClassAnalytics('nonexistent', 'week')).rejects.toThrow(
        'Class not found'
      );
    });

    test('should handle month period correctly', async () => {
      const mockClass = {
        id: 'class123',
        studentIds: ['student1'],
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockClass,
      });

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'student1',
          displayName: 'Alice',
          email: 'alice@test.com',
          dailyStats: [],
          courseProgress: {},
        }),
      });

      const result = await getClassAnalytics('class123', 'month');

      expect(result.period).toBe('month');
      expect(result.classId).toBe('class123');
    });
  });

  describe('getStudentAnalytics', () => {
    test('should return detailed analytics for a student', async () => {
      const mockStudent = {
        uid: 'student123',
        displayName: 'Alice',
        email: 'alice@test.com',
        photoURL: 'https://example.com/photo.jpg',
        lastActiveDate: new Date().toISOString(),
        currentStreak: 5,
        longestStreak: 10,
        dailyStats: [
          {
            date: '2026-02-01',
            wordsLearned: 15,
            timeSpent: 30,
            accuracy: 85,
          },
          {
            date: '2026-02-02',
            wordsLearned: 20,
            timeSpent: 45,
            accuracy: 90,
          },
        ],
        courseProgress: {
          TOEIC: {
            1: { completedVocabulary: true, quizScore: 85 },
            2: { completedVocabulary: true, quizScore: 90 },
          },
          TOEFL: {
            1: { completedVocabulary: true, quizScore: 80 },
          },
        },
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStudent,
      });

      const result = await getStudentAnalytics('student123');

      expect(result.studentId).toBe('student123');
      expect(result.displayName).toBe('Alice');
      expect(result.email).toBe('alice@test.com');
      expect(result.totalWordsLearned).toBe(35); // 15 + 20
      expect(result.totalTimeSpent).toBe(75); // 30 + 45
      expect(result.avgAccuracy).toBeCloseTo(87.5); // (85 + 90) / 2
      expect(result.currentStreak).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.daysCompleted).toBe(2);
      expect(result.activityTrend).toHaveLength(2);
      expect(result.courseProgress).toBeDefined();
    });

    test('should throw error when student does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(getStudentAnalytics('nonexistent')).rejects.toThrow(
        'Student not found'
      );
    });

    test('should handle student with no activity', async () => {
      const mockStudent = {
        uid: 'student456',
        displayName: 'Bob',
        email: 'bob@test.com',
        currentStreak: 0,
        longestStreak: 0,
        dailyStats: [],
        courseProgress: {},
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockStudent,
      });

      const result = await getStudentAnalytics('student456');

      expect(result.totalWordsLearned).toBe(0);
      expect(result.totalTimeSpent).toBe(0);
      expect(result.avgAccuracy).toBe(0);
      expect(result.daysCompleted).toBe(0);
      expect(result.activityTrend).toHaveLength(0);
    });
  });

  describe('getStudentsNeedingAttention', () => {
    test('should identify inactive students', async () => {
      const mockClass = {
        id: 'class123',
        studentIds: ['student1', 'student2'],
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockClass,
      });

      // Student 1: inactive (no activity in 10 days)
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'student1',
          displayName: 'Alice',
          email: 'alice@test.com',
          lastActiveDate: tenDaysAgo.toISOString(),
          dailyStats: [],
          courseProgress: {},
        }),
      });

      // Student 2: active
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'student2',
          displayName: 'Bob',
          email: 'bob@test.com',
          lastActiveDate: new Date().toISOString(),
          dailyStats: [
            { date: '2026-02-01', wordsLearned: 10, timeSpent: 20 },
          ],
          courseProgress: {},
        }),
      });

      const result = await getStudentsNeedingAttention('class123');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].alertType).toBe('inactive');
      expect(result[0].severity).toBe('high');
      expect(result[0].displayName).toBe('Alice');
    });

    test('should identify students with low quiz performance', async () => {
      const mockClass = {
        id: 'class123',
        studentIds: ['student1'],
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockClass,
      });

      // Student with low quiz scores
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'student1',
          displayName: 'Charlie',
          email: 'charlie@test.com',
          lastActiveDate: new Date().toISOString(),
          courseProgress: {
            TOEIC: {
              1: { quizScore: 50 },
              2: { quizScore: 55 },
              3: { quizScore: 45 },
            },
          },
          dailyStats: [],
        }),
      });

      const result = await getStudentsNeedingAttention('class123');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].alertType).toBe('low_performance');
      expect(result[0].severity).toBe('medium');
      expect(result[0].displayName).toBe('Charlie');
    });

    test('should return empty array when all students are doing well', async () => {
      const mockClass = {
        id: 'class123',
        studentIds: ['student1'],
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockClass,
      });

      // Active student with good performance
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          uid: 'student1',
          displayName: 'David',
          email: 'david@test.com',
          lastActiveDate: new Date().toISOString(),
          courseProgress: {
            TOEIC: {
              1: { quizScore: 85 },
              2: { quizScore: 90 },
            },
          },
          dailyStats: [
            { date: '2026-02-01', wordsLearned: 15, timeSpent: 30 },
          ],
        }),
      });

      const result = await getStudentsNeedingAttention('class123');

      expect(result).toHaveLength(0);
    });

    test('should throw error when class does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(getStudentsNeedingAttention('nonexistent')).rejects.toThrow(
        'Class not found'
      );
    });
  });
});
