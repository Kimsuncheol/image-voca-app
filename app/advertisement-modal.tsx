// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons"; // Icon library
import { Image } from "expo-image"; // Optimized image component
import { useLocalSearchParams, useRouter } from "expo-router"; // Navigation and route params
import { useVideoPlayer, VideoView } from "expo-video"; // Modern video player (replaces expo-av)
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Context and store imports
import { useAuth } from "../src/context/AuthContext";
import { useSubscriptionStore } from "../src/stores/subscriptionStore";

// Advertisement duration in seconds before reward can be claimed
const AD_DURATION = 5; // seconds

// Sample video sources for testing - simulates different advertisement videos
// In production, these would come from an ad network API
const TEST_ADS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

/**
 * Advertisement Modal Component
 *
 * Displays a video advertisement that users must watch for a specified duration
 * before they can claim a reward (e.g., unlock premium features temporarily).
 *
 * Features:
 * - Random ad selection from test pool
 * - 5-second countdown before reward can be claimed
 * - Automatic fallback to static image if video fails to load
 * - Looping video playback
 */
export default function AdvertisementModal() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ featureId: string }>(); // Feature to unlock after ad
  const { unlockViaAd } = useSubscriptionStore();

  // === State Management ===
  const [timeLeft, setTimeLeft] = useState(AD_DURATION); // Countdown timer
  const [isAdLoaded, setIsAdLoaded] = useState(false); // Loading state
  const [isRewardEarned, setIsRewardEarned] = useState(false); // Reward claimed state
  const [useVideoFallback, setUseVideoFallback] = useState(false); // Fallback to image on error

  // Random video source selected on mount
  const [videoSource, setVideoSource] = useState("");

  // === Video Player Setup (expo-video) ===
  // Initialize video player with configuration
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true; // Loop video continuously
    player.muted = false; // Play with sound
    player.play(); // Auto-play when ready
  });

  // Monitor video player status and handle errors
  // If video fails to load, automatically switch to fallback image
  useEffect(() => {
    const subscription = player.addListener(
      "statusChange",
      ({ status, error }) => {
        if (status === "error" || error) {
          console.log("[Ad] Video player error, using fallback image:", error);
          setUseVideoFallback(true);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Select a random advertisement video when component mounts
  useEffect(() => {
    const randomAd = TEST_ADS[Math.floor(Math.random() * TEST_ADS.length)];
    setVideoSource(randomAd);
  }, []);

  // Simulate advertisement loading delay (e.g., fetching from ad network)
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  // Countdown timer - decrements every second while ad is playing
  // User cannot claim reward until timer reaches 0
  useEffect(() => {
    if (isAdLoaded && !isRewardEarned) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
      // Timer finished: reward button will appear automatically
    }
  }, [isAdLoaded, timeLeft, isRewardEarned]);

  /**
   * Handles reward claiming after user watches the full ad
   * Unlocks the specified feature temporarily via ad reward system
   */
  const handleClaimReward = async () => {
    setIsRewardEarned(true);
    if (params.featureId && user?.uid) {
      await unlockViaAd(user.uid, params.featureId);
    }
    // Close modal after brief delay to show success state
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isAdLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading Advertisement...</Text>
        </View>
      ) : (
        <View style={styles.adContent}>
          {/* Ad Reward Timer - Always Visible */}
          {/* Top Bar: Timer or Close Button */}
          <View style={styles.topBar}>
            {timeLeft > 0 ? (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>Reward in {timeLeft}s</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClaimReward}
              >
                <Text style={styles.grantRewardText}>Grant Reward</Text>
                <Ionicons name="close-circle" size={30} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Video or Fallback Image */}
          <View style={styles.videoContainer}>
            {useVideoFallback ? (
              <Image
                source={require("../assets/images/test_ad.png")}
                style={styles.fallbackImage}
                contentFit="contain"
              />
            ) : (
              <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
              />
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.adLabelContainer}>
              <Ionicons name="volume-high" size={20} color="#666" />
              <Text style={styles.footerText}> Advertisement</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/**
 * Styles for the advertisement modal
 * Dark theme optimized for video playback experience
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // Black background for video viewing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 20,
    fontSize: 16,
  },
  adContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align timer/button to right
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 10,
  },
  timerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", // Semi-transparent overlay
    borderRadius: 20,
  },
  closeButton: {
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
  },
  grantRewardText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 4,
  },
  timerText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  videoContainer: {
    flex: 1,
    marginVertical: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  video: {
    flex: 1,
    width: "100%",
  },
  fallbackImage: {
    flex: 1,
    width: "100%",
  },
  footer: {
    height: 80, // Fixed height to prevent layout shifts
    alignItems: "center",
    justifyContent: "center",
  },
  adLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 8,
  },
  // Unused legacy styles (kept for backward compatibility)
  claimButton: {
    display: "none",
  },
  claimButtonText: {
    display: "none",
  },
});
