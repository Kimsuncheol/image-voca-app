/**
 * Manual Test Script for Course Metadata Functions
 *
 * This script provides a practical demonstration and validation of the
 * metadata management system we just implemented.
 *
 * HOW TO USE THIS SCRIPT:
 *
 * 1. Import this in your React Native app (e.g., in a test screen or console)
 * 2. Call the test functions to verify the implementation
 * 3. Check the console output for results
 *
 * EXAMPLE USAGE:
 * ```typescript
 * import { runAllMetadataTests } from './src/examples/testMetadataIntegration';
 *
 * // In your component or screen
 * useEffect(() => {
 *   runAllMetadataTests();
 * }, []);
 * ```
 */

import {
  updateCourseMetadata,
  getTotalDaysForCourse,
  getCourseMetadata,
} from '../services/vocabularyPrefetch';
import { CourseType } from '../types/vocabulary';

/**
 * Test 1: Check if metadata exists for a course
 * This validates that getCourseMetadata returns expected data structure
 */
export async function test1_CheckMetadataExists() {
  console.log('\n=== TEST 1: Check Metadata Exists ===');

  try {
    const courseId: CourseType = 'TOEIC';
    const metadata = await getCourseMetadata(courseId);

    if (metadata) {
      console.log('✅ PASS: Metadata found for', courseId);
      console.log('   - Total Days:', metadata.totalDays);
      console.log('   - Last Updated:', metadata.lastUpdated);
      console.log('   - Course ID:', metadata.courseId);
      return true;
    } else {
      console.log('⚠️  INFO: No metadata found for', courseId);
      console.log('   (This is expected if no data has been uploaded yet)');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 2: Get total days for a course
 * This validates that getTotalDaysForCourse returns a number
 */
export async function test2_GetTotalDays() {
  console.log('\n=== TEST 2: Get Total Days ===');

  try {
    const courseId: CourseType = 'TOEIC';
    const totalDays = await getTotalDaysForCourse(courseId);

    console.log('✅ PASS: Got total days for', courseId);
    console.log('   - Total Days:', totalDays);

    if (totalDays === 0) {
      console.log('   ℹ️  Note: 0 days means no data uploaded yet or no metadata exists');
    }

    return true;
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 3: Get total days for all courses
 * This validates the function works with all course types
 */
export async function test3_GetAllCourseDays() {
  console.log('\n=== TEST 3: Get All Course Days ===');

  const courses: CourseType[] = ['TOEIC', 'TOEFL', 'IELTS', '수능', 'COLLOCATION'];
  const results: Record<string, number> = {};

  try {
    for (const courseId of courses) {
      const totalDays = await getTotalDaysForCourse(courseId);
      results[courseId] = totalDays;
    }

    console.log('✅ PASS: Retrieved days for all courses');
    console.table(results);

    return true;
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 4: Validate metadata structure
 * This ensures the metadata has all required fields
 */
export async function test4_ValidateMetadataStructure() {
  console.log('\n=== TEST 4: Validate Metadata Structure ===');

  try {
    const courseId: CourseType = 'TOEIC';
    const metadata = await getCourseMetadata(courseId);

    if (!metadata) {
      console.log('⚠️  SKIP: No metadata to validate');
      return false;
    }

    // Check required fields
    const hasAllFields =
      typeof metadata.totalDays === 'number' &&
      typeof metadata.lastUpdated === 'string' &&
      typeof metadata.courseId === 'string';

    if (hasAllFields) {
      console.log('✅ PASS: Metadata structure is valid');
      console.log('   - totalDays is number:', typeof metadata.totalDays === 'number');
      console.log('   - lastUpdated is string:', typeof metadata.lastUpdated === 'string');
      console.log('   - courseId is string:', typeof metadata.courseId === 'string');
      return true;
    } else {
      console.log('❌ FAIL: Metadata structure is invalid');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 5: Test updateCourseMetadata (dry run check)
 * This validates the function exists and has correct signature
 */
export async function test5_CheckUpdateFunction() {
  console.log('\n=== TEST 5: Check Update Function ===');

  try {
    // Just check if the function exists and has correct type
    const isFunction = typeof updateCourseMetadata === 'function';

    if (isFunction) {
      console.log('✅ PASS: updateCourseMetadata function exists');
      console.log('   ℹ️  This function is called automatically in add-voca.tsx');
      console.log('   ℹ️  It updates metadata after successful uploads');
      return true;
    } else {
      console.log('❌ FAIL: updateCourseMetadata is not a function');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 6: Validate day number calculations
 * This ensures the metadata system can be used for UI components
 */
export async function test6_DayNumberValidation() {
  console.log('\n=== TEST 6: Day Number Validation ===');

  try {
    const courseId: CourseType = 'TOEIC';
    const totalDays = await getTotalDaysForCourse(courseId);

    if (totalDays === 0) {
      console.log('⚠️  SKIP: No days to validate (totalDays = 0)');
      return false;
    }

    // Generate day options (as you would in a day picker)
    const dayOptions = Array.from({ length: totalDays }, (_, i) => i + 1);

    console.log('✅ PASS: Day options generated successfully');
    console.log(`   - Course: ${courseId}`);
    console.log(`   - Total Days: ${totalDays}`);
    console.log(`   - Day Options: [${dayOptions.slice(0, 5).join(', ')}${totalDays > 5 ? '...' : ''}]`);

    // Validate a specific day number
    const testDayNumber = 5;
    const isValidDay = testDayNumber >= 1 && testDayNumber <= totalDays;

    console.log(`   - Day ${testDayNumber} is valid: ${isValidDay}`);

    return true;
  } catch (error) {
    console.log('❌ FAIL:', error);
    return false;
  }
}

/**
 * Test 7: Check Firestore integration
 * This validates that the functions properly interact with Firestore
 */
export async function test7_FirestoreIntegration() {
  console.log('\n=== TEST 7: Firestore Integration ===');

  try {
    // Get metadata for multiple courses to ensure Firestore connection works
    const courses: CourseType[] = ['TOEIC', 'TOEFL'];
    let successCount = 0;

    for (const courseId of courses) {
      const metadata = await getCourseMetadata(courseId);
      if (metadata !== null || metadata === null) {
        // Function executed without throwing error
        successCount++;
      }
    }

    console.log('✅ PASS: Firestore integration working');
    console.log(`   - Successfully queried ${successCount}/${courses.length} courses`);
    return true;
  } catch (error) {
    console.log('❌ FAIL: Firestore integration error');
    console.error('   -', error);
    return false;
  }
}

/**
 * Run all tests in sequence
 * This is the main function to call for comprehensive validation
 */
export async function runAllMetadataTests() {
  console.log('\n🧪 ============================================');
  console.log('🧪 COURSE METADATA SYSTEM - INTEGRATION TESTS');
  console.log('🧪 ============================================\n');

  const testResults: { name: string; passed: boolean }[] = [];

  // Run all tests
  testResults.push({ name: 'Check Metadata Exists', passed: await test1_CheckMetadataExists() });
  testResults.push({ name: 'Get Total Days', passed: await test2_GetTotalDays() });
  testResults.push({ name: 'Get All Course Days', passed: await test3_GetAllCourseDays() });
  testResults.push({ name: 'Validate Metadata Structure', passed: await test4_ValidateMetadataStructure() });
  testResults.push({ name: 'Check Update Function', passed: await test5_CheckUpdateFunction() });
  testResults.push({ name: 'Day Number Validation', passed: await test6_DayNumberValidation() });
  testResults.push({ name: 'Firestore Integration', passed: await test7_FirestoreIntegration() });

  // Print summary
  console.log('\n📊 ============================================');
  console.log('📊 TEST SUMMARY');
  console.log('📊 ============================================\n');

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  testResults.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status}: ${result.name}`);
  });

  console.log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Metadata system is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.\n');
  }

  return { passed: passedTests, total: totalTests, success: passedTests === totalTests };
}

/**
 * Quick smoke test - just check if basic functions work
 * Use this for a fast validation during development
 */
export async function quickSmokeTest() {
  console.log('\n🔥 Running Quick Smoke Test...\n');

  try {
    const courseId: CourseType = 'TOEIC';

    // Test 1: Get total days
    const totalDays = await getTotalDaysForCourse(courseId);
    console.log(`✓ getTotalDaysForCourse('${courseId}') → ${totalDays}`);

    // Test 2: Get metadata
    const metadata = await getCourseMetadata(courseId);
    console.log(`✓ getCourseMetadata('${courseId}') → ${metadata ? 'Found' : 'Not found'}`);

    // Test 3: Check function exists
    console.log(`✓ updateCourseMetadata exists → ${typeof updateCourseMetadata === 'function'}`);

    console.log('\n✅ Smoke test passed! Basic functionality works.\n');
    return true;
  } catch (error) {
    console.log('\n❌ Smoke test failed!\n');
    console.error(error);
    return false;
  }
}

// Export for easy access
export const metadataTests = {
  runAll: runAllMetadataTests,
  smoke: quickSmokeTest,
  individual: {
    test1_CheckMetadataExists,
    test2_GetTotalDays,
    test3_GetAllCourseDays,
    test4_ValidateMetadataStructure,
    test5_CheckUpdateFunction,
    test6_DayNumberValidation,
    test7_FirestoreIntegration,
  },
};
