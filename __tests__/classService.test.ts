import {
  createClass,
  getClassById,
  getTeacherClasses,
  updateClass,
  archiveClass,
  addStudentToClass,
  removeStudentFromClass,
  joinClassByCode,
  generateInviteCode,
} from '../src/services/classService';
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
const mockSetDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockArrayUnion = jest.fn((value) => ({ arrayUnion: value }));
const mockArrayRemove = jest.fn((value) => ({ arrayRemove: value }));
const mockServerTimestamp = jest.fn(() => new Date());

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('classService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClass', () => {
    test('should create a class with all required fields', async () => {
      const mockClassData = {
        name: 'English 101',
        teacherId: 'teacher123',
        courseIds: ['TOEIC', 'TOEFL'] as CourseType[],
        description: 'Beginner English class',
      };

      mockAddDoc.mockResolvedValue({ id: 'class123' });
      mockCollection.mockReturnValue('classes-collection');

      const result = await createClass(mockClassData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'classes');
      expect(mockAddDoc).toHaveBeenCalledWith(
        'classes-collection',
        expect.objectContaining({
          name: 'English 101',
          teacherId: 'teacher123',
          courseIds: ['TOEIC', 'TOEFL'],
          studentIds: [],
          isArchived: false,
        })
      );
      expect(result).toBe('class123');
    });

    test('should generate a 6-character invite code', async () => {
      const mockClassData = {
        name: 'Math 101',
        teacherId: 'teacher123',
        courseIds: ['TOEIC'] as CourseType[],
      };

      mockAddDoc.mockResolvedValue({ id: 'class456' });

      await createClass(mockClassData);

      const callArgs = mockAddDoc.mock.calls[0][1];
      expect(callArgs.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('should create class without optional description', async () => {
      const mockClassData = {
        name: 'Science 101',
        teacherId: 'teacher123',
        courseIds: ['IELTS'] as CourseType[],
      };

      mockAddDoc.mockResolvedValue({ id: 'class789' });

      await createClass(mockClassData);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          description: '',
        })
      );
    });
  });

  describe('getClassById', () => {
    test('should return class data when it exists', async () => {
      const mockClassData = {
        name: 'English 101',
        teacherId: 'teacher123',
        courseIds: ['TOEIC'],
        studentIds: ['student1', 'student2'],
        isArchived: false,
      };

      mockDoc.mockReturnValue('class-doc-ref');
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockClassData,
        id: 'class123',
      });

      const result = await getClassById('class123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'classes', 'class123');
      expect(result).toEqual({
        id: 'class123',
        ...mockClassData,
      });
    });

    test('should return null when class does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getClassById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTeacherClasses', () => {
    test('should return all non-archived classes for a teacher', async () => {
      const mockClasses = [
        {
          id: 'class1',
          name: 'English 101',
          teacherId: 'teacher123',
          isArchived: false,
        },
        {
          id: 'class2',
          name: 'English 102',
          teacherId: 'teacher123',
          isArchived: false,
        },
      ];

      mockQuery.mockReturnValue('filtered-query');
      mockGetDocs.mockResolvedValue({
        docs: mockClasses.map((classData) => ({
          id: classData.id,
          data: () => ({ ...classData }),
        })),
      });

      const result = await getTeacherClasses('teacher123');

      expect(mockWhere).toHaveBeenCalledWith('teacherId', '==', 'teacher123');
      expect(mockWhere).toHaveBeenCalledWith('isArchived', '==', false);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('English 101');
    });

    test('should return empty array when teacher has no classes', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      const result = await getTeacherClasses('teacher456');

      expect(result).toEqual([]);
    });
  });

  describe('updateClass', () => {
    test('should update class fields', async () => {
      const updates = {
        name: 'Advanced English',
        description: 'Updated description',
      };

      mockDoc.mockReturnValue('class-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateClass('class123', updates);

      expect(mockDoc).toHaveBeenCalledWith(db, 'classes', 'class123');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'class-doc-ref',
        expect.objectContaining({
          name: 'Advanced English',
          description: 'Updated description',
        })
      );
    });

    test('should handle update errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(
        updateClass('class123', { name: 'New Name' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('archiveClass', () => {
    test('should archive a class', async () => {
      mockDoc.mockReturnValue('class-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await archiveClass('class123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'class-doc-ref',
        expect.objectContaining({
          isArchived: true,
        })
      );
    });
  });

  describe('addStudentToClass', () => {
    test('should add student to class studentIds array', async () => {
      mockDoc.mockReturnValue('class-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await addStudentToClass('class123', 'student456');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'class-doc-ref',
        expect.objectContaining({
          studentIds: { arrayUnion: 'student456' },
        })
      );
    });

    test('should also update student document with classId', async () => {
      mockDoc
        .mockReturnValueOnce('class-doc-ref')
        .mockReturnValueOnce('student-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await addStudentToClass('class123', 'student456');

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'student456');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'student-doc-ref',
        expect.objectContaining({
          classIds: { arrayUnion: 'class123' },
        })
      );
    });
  });

  describe('removeStudentFromClass', () => {
    test('should remove student from class studentIds array', async () => {
      mockDoc.mockReturnValue('class-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await removeStudentFromClass('class123', 'student456');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'class-doc-ref',
        expect.objectContaining({
          studentIds: { arrayRemove: 'student456' },
        })
      );
    });

    test('should also update student document to remove classId', async () => {
      mockDoc
        .mockReturnValueOnce('class-doc-ref')
        .mockReturnValueOnce('student-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);

      await removeStudentFromClass('class123', 'student456');

      expect(mockDoc).toHaveBeenCalledWith(db, 'users', 'student456');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        'student-doc-ref',
        expect.objectContaining({
          classIds: { arrayRemove: 'class123' },
        })
      );
    });
  });

  describe('joinClassByCode', () => {
    test('should allow student to join class with valid invite code', async () => {
      const mockClass = {
        id: 'class123',
        name: 'English 101',
        inviteCode: 'ABC123',
        isArchived: false,
      };

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'class123',
            data: () => mockClass,
          },
        ],
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      await joinClassByCode('student456', 'ABC123');

      expect(mockWhere).toHaveBeenCalledWith('inviteCode', '==', 'ABC123');
      expect(mockWhere).toHaveBeenCalledWith('isArchived', '==', false);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2); // Class and student updates
    });

    test('should throw error when invite code is invalid', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [],
      });

      await expect(
        joinClassByCode('student456', 'INVALID')
      ).rejects.toThrow('Invalid invite code or class is archived');
    });

    test('should throw error when class is archived', async () => {
      const mockArchivedClass = {
        id: 'class123',
        inviteCode: 'ABC123',
        isArchived: true,
      };

      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'class123',
            data: () => mockArchivedClass,
          },
        ],
      });

      await expect(
        joinClassByCode('student456', 'ABC123')
      ).rejects.toThrow('Invalid invite code or class is archived');
    });
  });

  describe('generateInviteCode', () => {
    test('should generate a 6-character alphanumeric code', () => {
      const code = generateInviteCode();

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    test('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }

      // Should generate at least 95 unique codes out of 100 (allowing for rare collisions)
      expect(codes.size).toBeGreaterThan(95);
    });
  });
});
