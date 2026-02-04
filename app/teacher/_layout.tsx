/**
 * Teacher Layout
 *
 * Stack navigation layout for teacher-specific screens
 * Provides consistent headers and navigation patterns
 */

import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TeacherLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: t("common.back") || "Back",
        headerTintColor: "#007AFF",
      }}
    >
      {/* Main teacher screens */}
      <Stack.Screen
        name="classes"
        options={{
          title: t("teacher.classes.title") || "My Classes",
          headerLargeTitle: true,
        }}
      />

      {/* Class detail group */}
      <Stack.Screen
        name="class/[classId]/index"
        options={{
          title: t("teacher.classDetail.title") || "Class Details",
        }}
      />

      <Stack.Screen
        name="class/[classId]/students"
        options={{
          title: t("teacher.students.title") || "Students",
        }}
      />

      <Stack.Screen
        name="class/[classId]/assignments"
        options={{
          title: t("teacher.assignments.title") || "Assignments",
        }}
      />

      <Stack.Screen
        name="class/[classId]/analytics"
        options={{
          title: t("teacher.analytics.title") || "Analytics",
        }}
      />

      <Stack.Screen
        name="class/[classId]/settings"
        options={{
          title: t("teacher.classSettings.title") || "Class Settings",
        }}
      />

      {/* Assignment screens */}
      <Stack.Screen
        name="assignments/create"
        options={{
          presentation: "modal",
          title: t("teacher.createAssignment.title") || "Create Assignment",
        }}
      />

      <Stack.Screen
        name="assignments/[assignmentId]/detail"
        options={{
          title: t("teacher.assignmentDetail.title") || "Assignment Details",
        }}
      />

      <Stack.Screen
        name="assignments/[assignmentId]/edit"
        options={{
          presentation: "modal",
          title: t("teacher.editAssignment.title") || "Edit Assignment",
        }}
      />

      {/* Student detail */}
      <Stack.Screen
        name="students/[studentId]/profile"
        options={{
          title: t("teacher.studentProfile.title") || "Student Profile",
        }}
      />
    </Stack>
  );
}
