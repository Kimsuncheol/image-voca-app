import { TinderSwipe } from "@/src/components/tinder-swipe/TinderSwipe";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CardData, SwipeCardItem } from "../../components/swipe/SwipeCardItem";
import { useTheme } from "../../src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

const DUMMY_DATA: CardData[] = [
  {
    id: "1",
    name: "Emily",
    age: 24,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "2",
    name: "Jessica",
    age: 27,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80",
  },
  {
    id: "3",
    name: "David",
    age: 30,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "4",
    name: "Sarah",
    age: 22,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80",
  },
];

export default function SwipeScreen() {
  const { isDark } = useTheme();
  const [data, setData] = useState(DUMMY_DATA);
  const [lastDirection, setLastDirection] = useState<string | null>(null);

  const onSwipeRight = (item: any) => {
    setLastDirection("Right");
    console.log("Swiped right on:", item.name);
  };

  const onSwipeLeft = (item: any) => {
    setLastDirection("Left");
    console.log("Swiped left on:", item.name);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen options={{ title: "Discover" }} />
      <View style={styles.swipeContainer}>
        <TinderSwipe
          data={data}
          renderCard={(item) => <SwipeCardItem item={item} />}
          onSwipeRight={onSwipeRight}
          onSwipeLeft={onSwipeLeft}
          loop={true}
        />
      </View>
      {lastDirection && (
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: isDark ? "#fff" : "#333" }]}>
            Last Swiped: {lastDirection}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeContainer: {
    height: height * 0.7,
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    position: "absolute",
    bottom: 50,
  },
  infoText: {
    fontSize: 18,
  },
});
