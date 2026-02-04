/**
 * Join Class Modal Component
 *
 * Modal for students to join a class using an invite code
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { joinClassByCode } from "../../../src/services/classService";

interface JoinClassModalProps {
  visible: boolean;
  isDark: boolean;
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  visible,
  isDark,
  studentId,
  onClose,
  onSuccess,
}) => {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = getStyles(isDark);

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    try {
      setLoading(true);
      await joinClassByCode(studentId, inviteCode.trim());
      Alert.alert("Success", "You have joined the class successfully!", [
        {
          text: "OK",
          onPress: () => {
            setInviteCode("");
            onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error("Error joining class:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to join class"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={32} color="#007AFF" />
            </View>
            <Text style={styles.title}>Join a Class</Text>
            <Text style={styles.subtitle}>
              Enter the 6-character invite code provided by your teacher
            </Text>
          </View>

          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="#8e8e93"
              autoCapitalize="characters"
              maxLength={6}
              editable={!loading}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.joinButton,
                loading && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinClass}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Join Class</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "85%",
      maxWidth: 400,
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      alignItems: "center",
      marginBottom: 24,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? "#007AFF20" : "#007AFF10",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: "#8e8e93",
      textAlign: "center",
      lineHeight: 20,
    },
    inputSection: {
      marginBottom: 24,
    },
    input: {
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      textAlign: "center",
      letterSpacing: 4,
    },
    buttons: {
      flexDirection: "row",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
    },
    cancelButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    joinButton: {
      backgroundColor: "#007AFF",
    },
    joinButtonDisabled: {
      opacity: 0.5,
    },
    joinButtonText: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff",
    },
  });
