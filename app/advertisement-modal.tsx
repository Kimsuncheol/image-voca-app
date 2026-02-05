// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av"; // Video player (deprecated, will migrate to expo-video)
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Context and stores
import { useAuth } from "../src/context/AuthContext";
import { useSubscriptionStore } from "../src/stores/subscriptionStore";

// Advertisement services
import {
  getActiveAdvertisements,
  selectRandomAd,
} from "../src/services/advertisementService";
import type { Advertisement } from "../src/types/advertisement";

// Duration in seconds before user can claim reward
const AD_DURATION = 5; // seconds

/**
 * Sample video URLs for testing advertisement functionality
 * In production, these would be replaced with actual ad network videos
 */
const TEST_ADS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

/**
 * Advertisement Modal Screen
 *
 * Shows a video advertisement that users can watch to unlock premium features temporarily.
 * After watching for AD_DURATION seconds, users can claim the reward to unlock the feature.
 *
 * Flow:
 * 1. Display loading screen while ad prepares
 * 2. Play video advertisement with countdown timer
 * 3. After timer expires, show "Grant Reward" button
 * 4. User claims reward and feature is unlocked via ad
 *
 * @param featureId - The ID of the feature to unlock (passed via route params)
 */
export default function AdvertisementModal() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ featureId: string }>();
  const { unlockViaAd } = useSubscriptionStore();

  // === State Management ===

  const [timeLeft, setTimeLeft] = useState(AD_DURATION); // Countdown timer for reward eligibility
  const [isAdLoaded, setIsAdLoaded] = useState(false); // Whether ad has finished loading
  const [isRewardEarned, setIsRewardEarned] = useState(false); // Whether user has claimed the reward
  const [useVideoFallback, setUseVideoFallback] = useState(false); // Fallback to image if video fails
  const videoRef = useRef<Video>(null); // Reference to video player

  // Randomly selected video source (selected on component mount)
  const [videoSource, setVideoSource] = useState("");

  // Selected advertisement from Firestore
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  // === Effects ===

  /**
   * Load advertisement from Firestore (or fallback to TEST_ADS)
   * Fetches active ads, selects one randomly, and configures display
   */
  useEffect(() => {
    const loadAd = async () => {
      try {
        const activeAds = await getActiveAdvertisements();

        if (activeAds.length === 0) {
          // Fallback to TEST_ADS if no active ads in Firestore
          console.log("[Ad Modal] No active ads found, using TEST_ADS fallback");
          const randomAd =
            TEST_ADS[Math.floor(Math.random() * TEST_ADS.length)];
          setVideoSource(randomAd);
          setUseVideoFallback(false);
          return;
        }

        // Select random ad from Firestore
        const selected = selectRandomAd(activeAds);
        if (!selected) {
          console.warn("[Ad Modal] selectRandomAd returned null");
          setUseVideoFallback(true);
          return;
        }

        console.log(`[Ad Modal] Selected ad: ${selected.title} (${selected.type})`);
        setSelectedAd(selected);

        // Configure display based on ad type
        if (selected.type === "video" && selected.videoUrl) {
          setVideoSource(selected.videoUrl);
          setUseVideoFallback(false);
        } else if (selected.type === "image" && selected.imageUrl) {
          setVideoSource(selected.imageUrl);
          setUseVideoFallback(true); // Use image fallback display
        }
      } catch (error) {
        console.error("[Ad Modal] Failed to load ads:", error);
        // Fallback to TEST_ADS on error
        const randomAd = TEST_ADS[Math.floor(Math.random() * TEST_ADS.length)];
        setVideoSource(randomAd);
        setUseVideoFallback(false);
      }
    };

    loadAd();
  }, []);

  /**
   * Simulate ad loading delay
   * In production, this would wait for actual ad network response
   */
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  /**
   * Countdown timer effect
   * Decrements timeLeft every second until it reaches 0
   * When timer reaches 0, the "Grant Reward" button becomes available
   */
  useEffect(() => {
    if (isAdLoaded && !isRewardEarned) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
      // Timer finished: User can now claim reward
    }
  }, [isAdLoaded, timeLeft, isRewardEarned]);

  // === Event Handlers ===

  /**
   * Handles reward claim when user clicks "Grant Reward"
   * Unlocks the feature via ad and closes the modal
   */
  const handleClaimReward = async () => {
    setIsRewardEarned(true);
    if (params.featureId && user?.uid) {
      await unlockViaAd(user.uid, params.featureId);
    }
    // Close modal after a short delay to show success state
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  /**
   * Video playback status update handler
   * Could be used to track video progress or handle completion
   */
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // Optional: Auto-enable reward button when video completes
    // Currently relies on timer instead of video completion
  };

  /**
   * Handles video loading errors
   * Falls back to static image if video fails to load
   */
  const handleVideoError = () => {
    console.log("[Ad] Video failed to load, using fallback image");
    setUseVideoFallback(true);
  };

  // === Render ===

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading State: Show spinner while ad is preparing */}
      {!isAdLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading Advertisement...</Text>
        </View>
      ) : (
        <View style={styles.adContent}>
          {/* Top Bar: Shows countdown timer or reward button */}
          <View style={styles.topBar}>
            {/* Show countdown timer while waiting, then show reward button */}
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

          {/* Advertisement Video Player or Fallback Image */}
          <View style={styles.videoContainer}>
            {useVideoFallback ? (
              <Image
                source={
                  selectedAd?.type === "image" && selectedAd.imageUrl
                    ? { uri: selectedAd.imageUrl }
                    : require("../assets/images/test_ad.png")
                }
                style={styles.fallbackImage}
                contentFit="contain"
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: videoSource }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={true} // Loop video until user claims reward
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={handleVideoError}
                useNativeControls={false}
                isMuted={false}
              />
            )}
          </View>

          {/* Footer: Advertisement label */}
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

// === Styles ===

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // Black background for ad experience
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
    justifyContent: "flex-end", // Align to right
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 10,
  },
  timerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", // Semi-transparent background
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
  // Unused styles (kept for future use)
  claimButton: {
    display: "none",
  },
  claimButtonText: {
    display: "none",
  },
});
