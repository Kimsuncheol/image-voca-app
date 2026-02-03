import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  updateCourseMetadata,
  getTotalDaysForCourse,
  getCourseMetadata,
  getCourseConfig,
} from '../src/services/vocabularyPrefetch';
import { CourseType } from '../src/types/vocabulary';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
}));

// Mock the Firebase db instance
jest.mock('../src/services/firebase', () => ({
  db: {},
}));

describe('Course Metadata Management', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourseConfig', () => {
    test('should return correct config for TOEIC', () => {
      const config = getCourseConfig('TOEIC');
      expect(config.prefix).toBe('TOEIC');
      expect(config.path).toBeDefined();
    });

    test('should return correct config for 수능 (CSAT)', () => {
      const config = getCourseConfig('수능');
      expect(config.prefix).toBe('CSAT');
      expect(config.path).toBeDefined();
    });

    test('should return correct config for TOEFL', () => {
      const config = getCourseConfig('TOEFL');
      expect(config.prefix).toBe('TOEFL');
      expect(config.path).toBeDefined();
    });

    test('should return correct config for IELTS', () => {
      const config = getCourseConfig('IELTS');
      expect(config.prefix).toBe('IELTS');
      expect(config.path).toBeDefined();
    });

    test('should return correct config for COLLOCATION', () => {
      const config = getCourseConfig('COLLOCATION');
      expect(config.prefix).toBe('COLLOCATION');
      expect(config.path).toBeDefined();
    });
  });

  describe('updateCourseMetadata', () => {
    test('should create new metadata document when it does not exist', async () => {
      const courseId: CourseType = 'TOEIC';
      const dayNumber = 5;

      // Mock document does not exist
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      await updateCourseMetadata(courseId, dayNumber);

      // Verify setDoc was called with correct data
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalDays: dayNumber,
          courseId: courseId,
          lastUpdated: expect.any(String),
        })
      );
    });

    test('should update existing metadata when new day is greater', async () => {
      const courseId: CourseType = 'TOEIC';
      const currentMaxDay = 5;
      const newDayNumber = 10;

      // Mock document exists with current data
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ totalDays: currentMaxDay }),
      });

      await updateCourseMetadata(courseId, newDayNumber);

      // Verify updateDoc was called
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalDays: newDayNumber,
          lastUpdated: expect.any(String),
        })
      );
    });

    test('should not update metadata when new day is less than current max', async () => {
      const courseId: CourseType = 'TOEIC';
      const currentMaxDay = 10;
      const newDayNumber = 5;

      // Mock document exists with higher day count
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ totalDays: currentMaxDay }),
      });

      await updateCourseMetadata(courseId, newDayNumber);

      // Verify updateDoc was NOT called (day number not greater)
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      const courseId: CourseType = 'TOEIC';
      const dayNumber = 5;

      // Mock Firestore error
      const error = new Error('Firestore error');
      (getDoc as jest.Mock).mockRejectedValue(error);

      // Should throw the error
      await expect(updateCourseMetadata(courseId, dayNumber)).rejects.toThrow('Firestore error');
    });

    test('should handle course with no path configuration', async () => {
      // Create a spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call with invalid course (cast to bypass type checking)
      await updateCourseMetadata('INVALID_COURSE' as CourseType, 5);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'No path configuration for course:',
        'INVALID_COURSE'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getTotalDaysForCourse', () => {
    test('should return total days when metadata exists', async () => {
      const courseId: CourseType = 'TOEIC';
      const expectedDays = 30;

      // Mock document exists with totalDays
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ totalDays: expectedDays }),
      });

      const result = await getTotalDaysForCourse(courseId);

      expect(result).toBe(expectedDays);
    });

    test('should return 0 when metadata document does not exist', async () => {
      const courseId: CourseType = 'TOEIC';

      // Mock document does not exist
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getTotalDaysForCourse(courseId);

      expect(result).toBe(0);
    });

    test('should return 0 when totalDays is missing from metadata', async () => {
      const courseId: CourseType = 'TOEIC';

      // Mock document exists but has no totalDays field
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });

      const result = await getTotalDaysForCourse(courseId);

      expect(result).toBe(0);
    });

    test('should handle Firestore errors and return 0', async () => {
      const courseId: CourseType = 'TOEIC';

      // Mock Firestore error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await getTotalDaysForCourse(courseId);

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should handle course with no path configuration', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getTotalDaysForCourse('INVALID_COURSE' as CourseType);

      expect(result).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'No path configuration for course:',
        'INVALID_COURSE'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCourseMetadata', () => {
    test('should return complete metadata when document exists', async () => {
      const courseId: CourseType = 'TOEIC';
      const mockMetadata = {
        totalDays: 30,
        lastUpdated: '2026-02-03T10:30:00.000Z',
        courseId: 'TOEIC',
      };

      // Mock document exists with metadata
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockMetadata,
      });

      const result = await getCourseMetadata(courseId);

      expect(result).toEqual(mockMetadata);
      expect(result?.totalDays).toBe(30);
      expect(result?.courseId).toBe('TOEIC');
      expect(result?.lastUpdated).toBe('2026-02-03T10:30:00.000Z');
    });

    test('should return null when metadata document does not exist', async () => {
      const courseId: CourseType = 'TOEIC';

      // Mock document does not exist
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getCourseMetadata(courseId);

      expect(result).toBeNull();
    });

    test('should handle Firestore errors and return null', async () => {
      const courseId: CourseType = 'TOEIC';

      // Mock Firestore error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await getCourseMetadata(courseId);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should handle course with no path configuration', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getCourseMetadata('INVALID_COURSE' as CourseType);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'No path configuration for course:',
        'INVALID_COURSE'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle a complete upload workflow', async () => {
      const courseId: CourseType = 'TOEIC';

      // Scenario: First upload (day 1)
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      await updateCourseMetadata(courseId, 1);
      expect(setDoc).toHaveBeenCalledTimes(1);

      // Scenario: Second upload (day 2)
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ totalDays: 1 }),
      });

      await updateCourseMetadata(courseId, 2);
      expect(updateDoc).toHaveBeenCalledTimes(1);

      // Scenario: Re-upload same day (should not update)
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ totalDays: 2 }),
      });

      await updateCourseMetadata(courseId, 2);
      expect(updateDoc).toHaveBeenCalledTimes(1); // Still 1, not incremented
    });

    test('should work with all course types', async () => {
      const courses: CourseType[] = ['TOEIC', 'TOEFL', 'IELTS', '수능', 'COLLOCATION'];

      for (const courseId of courses) {
        // Mock metadata exists
        (getDoc as jest.Mock).mockResolvedValue({
          exists: () => true,
          data: () => ({
            totalDays: 25,
            lastUpdated: new Date().toISOString(),
            courseId,
          }),
        });

        const totalDays = await getTotalDaysForCourse(courseId);
        expect(totalDays).toBe(25);

        const metadata = await getCourseMetadata(courseId);
        expect(metadata).not.toBeNull();
        expect(metadata?.courseId).toBe(courseId);
      }
    });
  });
});
