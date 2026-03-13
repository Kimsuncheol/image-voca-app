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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import {
  listUserDeviceRegistrations,
  MAX_REGISTERED_DEVICES,
  removeUserDeviceRegistration,
} from "../src/services/deviceRegistrationService";
import type { ManageableDeviceRecord } from "../src/types/deviceRegistration";

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

export default function ManageDevicesScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const styles = getStyles(isDark);
  const [devices, setDevices] = useState<ManageableDeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    if (!user?.uid) {
      setDevices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextDevices = await listUserDeviceRegistrations(user.uid);
      setDevices(nextDevices);
    } catch (loadError) {
      console.warn("Failed to load registered devices", loadError);
      setError(t("manageDevices.error"));
    } finally {
      setLoading(false);
    }
  }, [t, user?.uid]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

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
                await loadDevices();
                Alert.alert(t("common.success"), t("manageDevices.removeSuccess"));
              } catch (removeError) {
                console.warn("Failed to remove device registration", removeError);
                Alert.alert(t("common.error"), t("manageDevices.removeError"));
              } finally {
                setRemovingDeviceId(null);
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
              <View key={device.deviceId}>
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
                      onPress={() => handleRemoveDevice(device)}
                      disabled={removingDeviceId === device.deviceId}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.removeButtonText}>
                        {removingDeviceId === device.deviceId
                          ? t("manageDevices.removing")
                          : t("manageDevices.remove")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
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
      color: isDark ? "#fff" : "#111",
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#8ab4ff" : "#1f5fbf",
    },
    helper: {
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? "#c7c7cc" : "#666",
    },
    stateCard: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 18,
      padding: 20,
    },
    stateText: {
      fontSize: 15,
      color: isDark ? "#fff" : "#333",
    },
    errorText: {
      fontSize: 15,
      color: isDark ? "#ffb4ab" : "#b3261e",
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
      color: isDark ? "#fff" : "#111",
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
      color: isDark ? "#8ab4ff" : "#1f5fbf",
    },
    deviceMeta: {
      fontSize: 14,
      color: isDark ? "#c7c7cc" : "#555",
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
      color: "#fff",
    },
  });
