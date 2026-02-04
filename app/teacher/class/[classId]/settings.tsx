/**
 * Class Settings Screen
 *
 * Allows teacher to update class information, manage settings, and archive
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { useSubscriptionStore } from "../../../../src/stores/subscriptionStore";
import {
  getClassById,
  updateClass,
  archiveClass,
} from "../../../../src/services/classService";
import type { ClassData } from "../../../../src/types/teacher";

export default function ClassSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const isTeacher = useSubscriptionStore((state) => state.isTeacher);
  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classData, setClassData] = useState<ClassData | null>(null);

  // Form fields
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [allowSelfEnrollment, setAllowSelfEnrollment] = useState(true);
  const [dailyGoal, setDailyGoal] = useState("");

  useEffect(() => {
    checkTeacherRole();
  }, []);

  useEffect(() => {
    if (!checkingRole && isTeacher()) {
      loadClassData();
    }
  }, [checkingRole, classId]);

  const checkTeacherRole = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    setCheckingRole(false);
  };

  const loadClassData = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const data = await getClassById(classId);
      if (data) {
        setClassData(data);
        setClassName(data.name || "");
        setDescription(data.description || "");
        setAllowSelfEnrollment(
          data.settings?.allowSelfEnrollment ?? true
        );
        setDailyGoal(data.settings?.dailyGoal?.toString() || "");
      }
    } catch (error) {
      console.error("Error loading class data:", error);
      Alert.alert(
        t("common.error"),
        t("teacher.classSettings.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!classId || !className.trim()) {
      Alert.alert(
        t("common.error"),
        t("teacher.classSettings.validation.nameRequired")
      );
      return;
    }

    try {
      setSaving(true);

      const updates = {
        name: className.trim(),
        description: description.trim(),
        settings: {
          allowSelfEnrollment,
          dailyGoal: dailyGoal ? parseInt(dailyGoal, 10) : undefined,
        },
        updatedAt: new Date().toISOString(),
      };

      await updateClass(classId, updates);

      Alert.alert(
        t("common.success"),
        t("teacher.classSettings.saveSuccess"),
        [
          {
            text: t("common.ok"),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving class settings:", error);
      Alert.alert(
        t("common.error"),
        t("teacher.classSettings.saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(
      t("teacher.classSettings.archiveConfirm.title"),
      t("teacher.classSettings.archiveConfirm.message"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("teacher.classSettings.archiveConfirm.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              if (classId) {
                await archiveClass(classId);
                Alert.alert(
                  t("common.success"),
                  t("teacher.classSettings.archiveSuccess"),
                  [
                    {
                      text: t("common.ok"),
                      onPress: () => router.replace("/teacher/classes"),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error("Error archiving class:", error);
              Alert.alert(
                t("common.error"),
                t("teacher.classSettings.archiveError")
              );
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (checkingRole) {
    return (
      <View style={[styles.loading, isDark && styles.loadingDark]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Permission denied state
  if (!isTeacher()) {
    return (
      <View style={[styles.denied, isDark && styles.deniedDark]}>
        <Ionicons name="lock-closed" size={64} color="#999" />
        <Text style={[styles.deniedText, isDark && styles.deniedTextDark]}>
          {t("teacher.permission.denied")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{t("common.goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
    >
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Basic Information */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                {t("teacher.classSettings.basicInfo")}
              </Text>

              <Text style={[styles.label, isDark && styles.labelDark]}>
                {t("teacher.class.create.className")}
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={className}
                onChangeText={setClassName}
                placeholder={t("teacher.class.create.classNamePlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />

              <Text style={[styles.label, isDark && styles.labelDark]}>
                {t("teacher.class.create.description")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  isDark && styles.inputDark,
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("teacher.class.create.descriptionPlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Class Settings */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                {t("teacher.classSettings.title")}
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>
                    {t("teacher.classSettings.allowSelfEnrollment")}
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.settingDescriptionDark]}>
                    {t("teacher.classSettings.allowSelfEnrollmentDesc")}
                  </Text>
                </View>
                <Switch
                  value={allowSelfEnrollment}
                  onValueChange={setAllowSelfEnrollment}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={allowSelfEnrollment ? "#007AFF" : "#f4f3f4"}
                />
              </View>

              <Text style={[styles.label, isDark && styles.labelDark]}>
                {t("teacher.classSettings.dailyGoal")}
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={dailyGoal}
                onChangeText={(text) => {
                  // Only allow numbers
                  const filtered = text.replace(/[^0-9]/g, "");
                  setDailyGoal(filtered);
                }}
                placeholder={t("teacher.classSettings.dailyGoalPlaceholder")}
                placeholderTextColor={isDark ? "#666" : "#999"}
                keyboardType="number-pad"
              />
              <Text style={[styles.hint, isDark && styles.hintDark]}>
                {t("teacher.classSettings.dailyGoalHint")}
              </Text>
            </View>

            {/* Invite Code */}
            {classData?.inviteCode && (
              <View style={[styles.section, isDark && styles.sectionDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  {t("teacher.class.detail.inviteCode")}
                </Text>
                <View style={styles.inviteCodeContainer}>
                  <Text style={[styles.inviteCode, isDark && styles.inviteCodeDark]}>
                    {classData.inviteCode}
                  </Text>
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>

            {/* Archive Button */}
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={handleArchive}
            >
              <Ionicons name="archive-outline" size={20} color="#FF3B30" />
              <Text style={styles.archiveButtonText}>
                {t("teacher.class.detail.archive")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingDark: {
    backgroundColor: "#000",
  },
  denied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  deniedDark: {
    backgroundColor: "#000",
  },
  deniedText: {
    fontSize: 18,
    color: "#333",
    marginTop: 16,
    marginBottom: 24,
  },
  deniedTextDark: {
    color: "#FFF",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: "#1C1C1E",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: "#FFF",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  labelDark: {
    color: "#FFF",
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  inputDark: {
    backgroundColor: "#2C2C2E",
    borderColor: "#3A3A3C",
    color: "#FFF",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  hintDark: {
    color: "#999",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingLabelDark: {
    color: "#FFF",
  },
  settingDescription: {
    fontSize: 13,
    color: "#666",
  },
  settingDescriptionDark: {
    color: "#999",
  },
  inviteCodeContainer: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
    letterSpacing: 4,
  },
  inviteCodeDark: {
    color: "#0A84FF",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  archiveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  archiveButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
