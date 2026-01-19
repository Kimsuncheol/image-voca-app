import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubscriptionStore } from "../src/stores/subscriptionStore";

const AD_DURATION = 5; // seconds

export default function AdvertisementModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ featureId: string }>();
  const { unlockViaAd } = useSubscriptionStore();
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [isRewardEarned, setIsRewardEarned] = useState(false);

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
      } else {
        // Ad finished
        setIsRewardEarned(true);
        if (params.featureId) {
          (async () => {
            await unlockViaAd(params.featureId);
          })();
        }
      }
    }
  }, [isAdLoaded, timeLeft, isRewardEarned, unlockViaAd, params.featureId]);

  const handleClose = () => {
    if (isRewardEarned) {
      router.back();
    }
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
          <View style={styles.header}>
            <Text style={styles.timerText}>
              {isRewardEarned ? "Reward Granted" : `Reward in ${timeLeft}s`}
            </Text>
            {isRewardEarned && (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={30} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>
              AMAZING PRODUCT ADVERTISEMENT
            </Text>
            <Text style={styles.subText}>
              Imagine a cool video playing here...
            </Text>
            <Ionicons
              name="videocam"
              size={100}
              color="#555"
              style={{ marginTop: 20 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Advertisement</Text>
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
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
  },
  timerText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    marginVertical: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  placeholderText: {
    color: "#ffcc00",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subText: {
    color: "#888",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    color: "#444",
    fontSize: 12,
  },
});
