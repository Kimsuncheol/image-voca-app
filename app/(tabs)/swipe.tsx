import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { useSubscriptionStore } from "../../src/stores";
import {
  Course,
  COURSES,
  CourseType,
  findRuntimeCourse,
  isJlptParentCourseId,
} from "../../src/types/vocabulary";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [recentCourse, setRecentCourse] = useState<CourseType | null>(null);
  const { fetchSubscription } = useSubscriptionStore();

  const fetchRecentCourse = useCallback(async () => {
    try {
      const savedCourse = await AsyncStorage.getItem("recentCourse");
      if (savedCourse) {
        setRecentCourse(savedCourse as CourseType);
      } else if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRecentCourse(userDoc.data().recentCourse || null);
        }
      }
    } catch (error) {
      console.error("Error fetching recent course:", error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchRecentCourse();
      if (user) {
        fetchSubscription(user.uid);
      }
    }, [fetchRecentCourse, fetchSubscription, user])
  );

  const handleCourseSelect = async (course: Course) => {
    try {
      if (isJlptParentCourseId(course.id)) {
        router.push("/course/jlpt-levels");
        return;
      }

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          recentCourse: course.id,
        });
      }

      await AsyncStorage.setItem("recentCourse", course.id);
      setRecentCourse(course.id);

      router.push({
        pathname: "/course/[courseId]/days",
        params: { courseId: course.id },
      });
    } catch (error) {
      console.error("Error updating recent course:", error);
    }
  };

  const recentCourseData = findRuntimeCourse(recentCourse ?? undefined);
  const otherCourses = COURSES.filter((c) => c.id !== recentCourse);

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VocaHeader />
        {recentCourseData && (
          <RecentCourseSection
            course={recentCourseData}
            onPress={() =>
              router.push({
                pathname: "/course/[courseId]/days",
                params: { courseId: recentCourseData.id },
              })
            }
          />
        )}
        <AllCoursesSection
          courses={recentCourse ? otherCourses : COURSES}
          onCoursePress={handleCourseSelect}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
