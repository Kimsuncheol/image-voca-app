import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AllCoursesSection,
  RecentCourseSection,
  VocaHeader,
} from "../../components/course";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { db } from "../../src/services/firebase";
import { useSubscriptionStore } from "../../src/stores";
import { Course, COURSES, CourseType } from "../../src/types/vocabulary";

export default function CourseSelectionScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [recentCourse, setRecentCourse] = useState<CourseType | null>(null);
  const { canAccessSpeaking, fetchSubscription } = useSubscriptionStore();
  const { t } = useTranslation();

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
      if (course.id === "TOEIC_SPEAKING" && !canAccessSpeaking()) {
        Alert.alert(
          t("alerts.premiumFeature.title"),
          t("alerts.premiumFeature.message"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("common.upgrade"),
              onPress: () => router.push("/billing"),
            },
          ]
        );
        return;
      }

      if (user) {
        updateDoc(doc(db, "users", user.uid), {
          recentCourse: course.id,
        }).catch((err) => console.error("Error syncing recent course:", err));
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

  const recentCourseData = COURSES.find((c) => c.id === recentCourse);
  const otherCourses = COURSES.filter((c) => c.id !== recentCourse);

  return (
    <SafeAreaView
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
            onPress={() => handleCourseSelect(recentCourseData)}
          />
        )}
        <AllCoursesSection
          courses={recentCourse ? otherCourses : COURSES}
          onCoursePress={handleCourseSelect}
        />
      </ScrollView>
    </SafeAreaView>
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
