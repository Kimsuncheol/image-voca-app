import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFontColors } from "../constants/fontColors";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import {
  listUserDeviceRegistrations,
  MAX_REGISTERED_DEVICES,
  removeUserDeviceRegistration,
} from "../src/services/deviceRegistrationService";
import type { ManageableDeviceRecord } from "../src/types/deviceRegistration";

const REMOVE_EXIT_DURATION_MS = 200;
const LIST_LAYOUT_DURATION_MS = 220;
const REMOVE_EXIT_TRANSLATE_X = -16;
const REMOVE_EXIT_SCALE = 0.98;

const rowLayoutTransition = LinearTransition.duration(LIST_LAYOUT_DURATION_MS).easing(
  Easing.inOut(Easing.ease),
);

type DeviceRowProps = {
  device: ManageableDeviceRecord;
  index: number;
  isRemoving: boolean;
  isExiting: boolean;
  onExitComplete: (deviceId: string) => void;
  onRemove: (device: ManageableDeviceRecord) => void;
  styles: ReturnType<typeof getStyles>;
  t: ReturnType<typeof useTranslation>["t"];
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().split("T")[0];
};

const getProviderLabel = (
  authProvider: string,
  t: ReturnType<typeof useTranslation>["t"],
) => {
  if (authProvider === "google.com") {
    return t("manageDevices.authProvider.google.com");
  }
  if (authProvider === "password") {
    return t("manageDevices.authProvider.password");
  }
  return t("manageDevices.authProvider.unknown");
};

function DeviceRow({
  device,
  index,
  isRemoving,
  isExiting,
  onExitComplete,
  onRemove,
  styles,
  t,
}: DeviceRowProps) {
  const exitProgress = useSharedValue(0);

  useEffect(() => {
    if (!isExiting) {
      return;
    }

    exitProgress.value = withTiming(
      1,
      {
        duration: REMOVE_EXIT_DURATION_MS,
        easing: Easing.out(Easing.ease),
      },
      (finished) => {
        if (finished) {
          runOnJS(onExitComplete)(device.deviceId);
        }
      },
    );
  }, [device.deviceId, exitProgress, isExiting, onExitComplete]);

  const animatedRowStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      { translateX: REMOVE_EXIT_TRANSLATE_X * exitProgress.value },
      { scale: 1 - (1 - REMOVE_EXIT_SCALE) * exitProgress.value },
    ],
  }));

  return (
    <Animated.View layout={rowLayoutTransition} style={animatedRowStyle}>
      {index > 0 && <View style={styles.separator} />}
      <View style={styles.deviceRow}>
        <View style={styles.deviceContent}>
          <View style={styles.deviceTitleRow}>
            <Text style={styles.deviceTitle}>
              {device.modelName || t("manageDevices.unknownDevice")}
            </Text>
            {device.isCurrentDevice && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {t("manageDevices.currentBadge")}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.deviceMeta}>
            {device.platform.toUpperCase()} {device.osVersion || ""}
          </Text>
          <Text style={styles.deviceMeta}>
            {getProviderLabel(device.authProvider, t)}
          </Text>
          <Text style={styles.deviceMeta}>
            {t("manageDevices.lastSeen", {
              date: formatDateLabel(device.lastSeenAt),
            })}
          </Text>
          <Text style={styles.deviceMeta}>
            {t("manageDevices.registeredOn", {
              date: formatDateLabel(device.createdAt),
            })}
          </Text>
        </View>

        {!device.isCurrentDevice && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(device)}
            disabled={isRemoving || isExiting}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.removeButtonText}>
              {isRemoving ? t("manageDevices.removing") : t("manageDevices.remove")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function ManageDevicesScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(isDark);
  const [devices, setDevices] = useState<ManageableDeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [exitingDeviceIds, setExitingDeviceIds] = useState<Record<string, true>>({});

  const loadDevices = useCallback(
    async ({
      excludeDeviceIds = [],
      showLoading = true,
      showErrorState = true,
    }: {
      excludeDeviceIds?: string[];
      showLoading?: boolean;
      showErrorState?: boolean;
    } = {}) => {
      if (!user?.uid) {
        setDevices([]);
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
          setError(null);
        }
        const nextDevices = await listUserDeviceRegistrations(user.uid);
        setDevices(
          nextDevices.filter(
            (device) => !excludeDeviceIds.includes(device.deviceId),
          ),
        );
      } catch (loadError) {
        console.warn("Failed to load registered devices", loadError);
        if (showErrorState) {
          setError(t("manageDevices.error"));
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [t, user?.uid],
  );

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const handleExitComplete = useCallback(
    (deviceId: string) => {
      setDevices((currentDevices) =>
        currentDevices.filter((device) => device.deviceId !== deviceId),
      );
      setExitingDeviceIds((currentIds) => {
        const nextIds = { ...currentIds };
        delete nextIds[deviceId];
        return nextIds;
      });
      setRemovingDeviceId((currentId) =>
        currentId === deviceId ? null : currentId,
      );
      void loadDevices({
        excludeDeviceIds: [deviceId],
        showLoading: false,
        showErrorState: false,
      });
      Alert.alert(t("common.success"), t("manageDevices.removeSuccess"));
    },
    [loadDevices, t],
  );

  const handleRemoveDevice = (device: ManageableDeviceRecord) => {
    Alert.alert(
      t("manageDevices.confirmTitle"),
      t("manageDevices.confirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("manageDevices.remove"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!user?.uid) return;
              try {
                setRemovingDeviceId(device.deviceId);
                await removeUserDeviceRegistration(user.uid, device.deviceId);
                setExitingDeviceIds((currentIds) => ({
                  ...currentIds,
                  [device.deviceId]: true,
                }));
              } catch (removeError) {
                console.warn("Failed to remove device registration", removeError);
                setRemovingDeviceId((currentId) =>
                  currentId === device.deviceId ? null : currentId,
                );
                Alert.alert(t("common.error"), t("manageDevices.removeError"));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ title: t("manageDevices.title") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>{t("manageDevices.title")}</Text>
          <Text style={styles.subtitle}>
            {t("manageDevices.subtitle", {
              count: devices.length,
              max: MAX_REGISTERED_DEVICES,
            })}
          </Text>
          <Text style={styles.helper}>{t("manageDevices.helper")}</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t("manageDevices.loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t("manageDevices.empty")}</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {devices.map((device, index) => (
              <DeviceRow
                key={device.deviceId}
                device={device}
                index={index}
                isRemoving={removingDeviceId === device.deviceId}
                isExiting={Boolean(exitingDeviceIds[device.deviceId])}
                onExitComplete={handleExitComplete}
                onRemove={handleRemoveDevice}
                styles={styles}
                t={t}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => {
  const fontColors = getFontColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f2f2f7",
    },
    content: {
      padding: 16,
      gap: 16,
      paddingBottom: 32,
    },
    headerCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 18,
      padding: 20,
      gap: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: fontColors.screenTitleCompact,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "600",
      color: fontColors.actionAccentStrong,
    },
    helper: {
      fontSize: 14,
      lineHeight: 20,
      color: fontColors.deviceHelper,
    },
    stateCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 18,
      padding: 20,
    },
    stateText: {
      fontSize: 15,
      color: fontColors.screenBodyStrong,
    },
    errorText: {
      fontSize: 15,
      color: fontColors.dangerText,
    },
    listCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 18,
      overflow: "hidden",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? "#38383a" : "#c6c6c8",
      marginLeft: 20,
    },
    deviceRow: {
      padding: 20,
      gap: 16,
    },
    deviceContent: {
      gap: 6,
    },
    deviceTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    deviceTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: fontColors.screenTitleCompact,
    },
    badge: {
      backgroundColor: isDark ? "#14304d" : "#e7f0ff",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: fontColors.actionAccentStrong,
    },
    deviceMeta: {
      fontSize: 14,
      color: fontColors.deviceMeta,
    },
    removeButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#d92d20",
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    removeButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: fontColors.buttonOnAccent,
    },
  });
};
