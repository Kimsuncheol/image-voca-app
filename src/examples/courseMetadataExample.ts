/**
 * Example: How to use Course Metadata Functions
 *
 * These functions help you get information about how many days are available
 * for each course in your vocabulary app.
 */

import { getTotalDaysForCourse, getCourseMetadata } from '../services/vocabularyPrefetch';
import { CourseType } from '../types/vocabulary';

// ============================================================================
// EXAMPLE 1: Get Total Days for a Course
// ============================================================================

/**
 * Get the total number of days available for TOEIC course
 * This is useful when displaying a course overview or day picker
 */
export async function example1_GetTotalDays() {
  const totalDays = await getTotalDaysForCourse('TOEIC');
  console.log(`TOEIC has ${totalDays} days available`);

  // Use this to:
  // - Display "Day 1 / 30" progress indicators
  // - Validate day selection in pickers
  // - Show course completion percentage

  return totalDays;
}

// ============================================================================
// EXAMPLE 2: Get All Course Days Dynamically
// ============================================================================

/**
 * Get total days for all courses and display in a UI
 * Useful for course selection screens
 */
export async function example2_GetAllCourseDays() {
  const courses: CourseType[] = ['TOEIC', 'TOEFL', 'IELTS', '수능'];

  const courseDaysMap: Record<string, number> = {};

  for (const courseId of courses) {
    const totalDays = await getTotalDaysForCourse(courseId);
    courseDaysMap[courseId] = totalDays;
  }

  console.log('Course Days:', courseDaysMap);
  // Example output: { TOEIC: 30, TOEFL: 25, IELTS: 20, 수능: 40 }

  return courseDaysMap;
}

// ============================================================================
// EXAMPLE 3: Get Complete Course Metadata
// ============================================================================

/**
 * Get full metadata including last update time
 * Useful for showing when content was last updated
 */
export async function example3_GetCourseMetadata() {
  const metadata = await getCourseMetadata('TOEIC');

  if (metadata) {
    console.log(`TOEIC Course Info:`);
    console.log(`- Total Days: ${metadata.totalDays}`);
    console.log(`- Last Updated: ${metadata.lastUpdated}`);
    console.log(`- Course ID: ${metadata.courseId}`);
  } else {
    console.log('No metadata found for TOEIC');
  }

  return metadata;
}

// ============================================================================
// EXAMPLE 4: Dynamic Day Picker Component
// ============================================================================

/**
 * Use in a React component to dynamically generate day options
 */
export async function example4_GenerateDayPicker(courseId: CourseType) {
  const totalDays = await getTotalDaysForCourse(courseId);

  // Generate array of day numbers: [1, 2, 3, ..., totalDays]
  const dayOptions = Array.from({ length: totalDays }, (_, i) => i + 1);

  console.log(`Day options for ${courseId}:`, dayOptions);

  // Use this array to render:
  // - Dropdown options
  // - Grid of day buttons
  // - Swipeable day cards

  return dayOptions;
}

// ============================================================================
// EXAMPLE 5: Validate Day Number
// ============================================================================

/**
 * Check if a day number is valid for a course
 * Useful for URL validation or user input validation
 */
export async function example5_ValidateDayNumber(
  courseId: CourseType,
  dayNumber: number
): Promise<boolean> {
  const totalDays = await getTotalDaysForCourse(courseId);

  const isValid = dayNumber >= 1 && dayNumber <= totalDays;

  if (!isValid) {
    console.log(
      `Invalid day ${dayNumber} for ${courseId}. Valid range: 1-${totalDays}`
    );
  }

  return isValid;
}

// ============================================================================
// EXAMPLE 6: Calculate Course Progress
// ============================================================================

/**
 * Calculate what percentage of a course has been completed
 */
export async function example6_CalculateProgress(
  courseId: CourseType,
  completedDays: number[]
): Promise<number> {
  const totalDays = await getTotalDaysForCourse(courseId);

  if (totalDays === 0) return 0;

  const progressPercentage = (completedDays.length / totalDays) * 100;

  console.log(
    `Progress: ${completedDays.length}/${totalDays} days (${progressPercentage.toFixed(1)}%)`
  );

  return progressPercentage;
}

// ============================================================================
// EXAMPLE 7: React Hook Usage
// ============================================================================

/**
 * Example React hook for using course metadata in components
 * You can create this hook in your hooks directory
 */

/*
import { useState, useEffect } from 'react';
import { getTotalDaysForCourse } from '../services/vocabularyPrefetch';
import { CourseType } from '../types/vocabulary';

export function useCourseDays(courseId: CourseType) {
  const [totalDays, setTotalDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTotalDays = async () => {
      try {
        setLoading(true);
        const days = await getTotalDaysForCourse(courseId);
        if (isMounted) {
          setTotalDays(days);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTotalDays();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  return { totalDays, loading, error };
}

// Usage in a component:
function DayPickerScreen({ courseId }: { courseId: CourseType }) {
  const { totalDays, loading } = useCourseDays(courseId);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Select a day (1-{totalDays})</Text>
      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
        <Button key={day} title={`Day ${day}`} onPress={() => {}} />
      ))}
    </View>
  );
}
*/

// ============================================================================
// INTEGRATION NOTES
// ============================================================================

/*
IMPORTANT: The metadata system works automatically!

1. When you upload data via the admin panel (add-voca.tsx):
   - The metadata document is automatically created/updated
   - It tracks the highest day number uploaded

2. In your app:
   - Use getTotalDaysForCourse() to get the day count
   - Use it in day pickers, progress indicators, etc.
   - The data is always accurate and up-to-date

3. Metadata Document Structure in Firestore:

   courses/TOEIC/_metadata
   {
     totalDays: 30,
     lastUpdated: "2026-02-03T10:30:00.000Z",
     courseId: "TOEIC"
   }

4. Performance:
   - Very fast: single document read
   - No need to query multiple collections
   - Can be cached for even better performance
*/
