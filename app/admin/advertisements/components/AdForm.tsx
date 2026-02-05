/**
 * AdForm Component
 *
 * Form for creating advertisements with image upload or video URL input.
 * Pattern based on GenerationForm.tsx and image upload from profile.tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  launchImageLibraryAsync,
  MediaTypeOptions,
} from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createAdvertisement } from "../../../../src/services/advertisementService";
import type { AdFormData, AdType } from "../../../../src/types/advertisement";

interface AdFormProps {
  onAdCreated: () => void;
  userId: string;
  isDark: boolean;
}

export function AdForm({ onAdCreated, userId, isDark }: AdFormProps) {
  const styles = getStyles(isDark);

  // Form State
  const [type, setType] = useState<AdType>("image");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle image selection
  const handlePickImage = async () => {
    try {
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter an ad title");
      return false;
    }

    if (type === "image" && !imageUri) {
      Alert.alert("Validation Error", "Please select an image");
      return false;
    }

    if (type === "video" && !videoUrl.trim()) {
      Alert.alert("Validation Error", "Please enter a video URL");
      return false;
    }

    if (type === "video" && videoUrl && !videoUrl.startsWith("http")) {
      Alert.alert("Validation Error", "Video URL must start with http:// or https://");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setType("image");
    setImageUri(null);
    setVideoUrl("");
    setTitle("");
    setDescription("");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    try {
      const formData: AdFormData = {
        type,
        title: title.trim(),
        description: description.trim(),
        ...(type === "image" && imageUri ? { imageFile: { uri: imageUri } } : {}),
        ...(type === "video" && videoUrl ? { videoUrl: videoUrl.trim() } : {}),
      };

      await createAdvertisement(formData, userId);

      Alert.alert("Success", "Advertisement created successfully");
      resetForm();
      onAdCreated();
    } catch (error: any) {
      console.error("Create ad error:", error);
      Alert.alert("Error", error.message || "Failed to create advertisement");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advertisement Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "image" && styles.typeButtonActive,
            ]}
            onPress={() => setType("image")}
          >
            <Ionicons
              name="image"
              size={20}
              color={type === "image" ? "#007AFF" : (isDark ? "#888" : "#666")}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === "image" && styles.typeButtonTextActive,
              ]}
            >
              Image
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === "video" && styles.typeButtonActive,
            ]}
            onPress={() => setType("video")}
          >
            <Ionicons
              name="videocam"
              size={20}
              color={type === "video" ? "#007AFF" : (isDark ? "#888" : "#666")}
            />
            <Text
              style={[
                styles.typeButtonText,
                type === "video" && styles.typeButtonTextActive,
              ]}
            >
              Video
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Media Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {type === "image" ? "Image" : "Video URL"}
        </Text>

        {type === "image" ? (
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={isDark ? "#666" : "#999"}
                />
                <Text style={styles.placeholderText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="https://example.com/video.mp4"
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        )}
      </View>

      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ad title (for admin reference)"
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Description Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add notes about this advertisement"
          placeholderTextColor={isDark ? "#666" : "#999"}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          uploading && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitButtonText}>Creating...</Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Create Advertisement</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    required: {
      color: "#dc3545",
    },
    typeSelector: {
      flexDirection: "row",
      gap: 12,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#e0e0e0",
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
    },
    typeButtonActive: {
      borderColor: "#007AFF",
      backgroundColor: isDark ? "#1a2942" : "#e6f2ff",
    },
    typeButtonText: {
      fontSize: 15,
      fontWeight: "500",
      color: isDark ? "#888" : "#666",
    },
    typeButtonTextActive: {
      color: "#007AFF",
    },
    imagePicker: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDark ? "#1c1c1e" : "#f2f2f7",
      borderWidth: 2,
      borderColor: isDark ? "#333" : "#e0e0e0",
      borderStyle: "dashed",
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    placeholderText: {
      fontSize: 14,
      color: isDark ? "#666" : "#999",
    },
    imagePreview: {
      width: "100%",
      height: "100%",
    },
    input: {
      backgroundColor: isDark ? "#1c1c1e" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#e0e0e0",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: isDark ? "#fff" : "#000",
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#007AFF",
      borderRadius: 10,
      paddingVertical: 14,
      marginTop: 8,
    },
    submitButtonDisabled: {
      backgroundColor: "#666",
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
    },
    bottomSpacer: {
      height: 40,
    },
  });
}
