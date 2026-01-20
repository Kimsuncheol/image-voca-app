import { Ionicons } from "@expo/vector-icons";
import { AVPlaybackStatus, ResizeMode, Video } from "expo-av";
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
import { useAuth } from "../src/context/AuthContext";
import { useSubscriptionStore } from "../src/stores/subscriptionStore";

const AD_DURATION = 5; // seconds

// For testing: 5 different sample videos to simulate different ads
const TEST_ADS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

export default function AdvertisementModal() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ featureId: string }>();
  const { unlockViaAd } = useSubscriptionStore();
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isRewardEarned, setIsRewardEarned] = useState(false);
  const [useVideoFallback, setUseVideoFallback] = useState(false);
  const videoRef = useRef<Video>(null);

  // Select a random video on mount
  const [videoSource, setVideoSource] = useState("");

  useEffect(() => {
    const randomAd = TEST_ADS[Math.floor(Math.random() * TEST_ADS.length)];
    setVideoSource(randomAd);
  }, []);

  useEffect(() => {
    // Simulate ad loading
    const loadTimer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 1500);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (isAdLoaded && !isRewardEarned) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
      // Timer finished: Do nothing here, just let the UI show the button
    }
  }, [isAdLoaded, timeLeft, isRewardEarned]);

  const handleClaimReward = async () => {
    setIsRewardEarned(true);
    if (params.featureId && user?.uid) {
      await unlockViaAd(user.uid, params.featureId);
    }
    // Close after a short delay to show "Granted" state
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // Optional: If video finishes before user clicks, maybe auto-show button or just loop?
    // For now, relies on timer. The user said video plays for 30s, button appears in 5s.
  };

  const handleVideoError = () => {
    console.log("[Ad] Video failed to load, using fallback image");
    setUseVideoFallback(true);
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
              <Video
                ref={videoRef}
                source={{ uri: videoSource }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={true} // Loop so it keeps playing until user clicks
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onError={handleVideoError}
                useNativeControls={false}
                isMuted={false}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: "rgba(0,0,0,0.6)",
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
    height: 80, // Fixed height to prevent layout jumps
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
  claimButton: {
    display: "none",
  },
  claimButtonText: {
    display: "none",
  },
});
