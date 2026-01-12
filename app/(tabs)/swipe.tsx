import {
  TinderSwipe,
  TinderSwipeRef,
} from "@/src/components/tinder-swipe/TinderSwipe";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SwipeCardItem,
  VocabularyCard,
} from "../../components/swipe/SwipeCardItem";
import { useTheme } from "../../src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export const DUMMY_DATA: VocabularyCard[] = [
  {
    id: "1",
    word: "Serendipity",
    pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
    definition:
      "The occurrence and development of events by chance in a happy or beneficial way.",
    example:
      "It was pure serendipity that we met at the coffee shop right before it started raining.",
    image:
      "https://images.unsplash.com/photo-1549488497-29cb95d5cb2e?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "2",
    word: "Petrichor",
    pronunciation: "/ˈpet.rɪ.kɔːr/",
    definition:
      "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.",
    example:
      "As the storm broke, the air was filled with the distinct scent of petrichor.",
    image:
      "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: "3",
    word: "Ephemeral",
    pronunciation: "/ɪˈfem.ər.əl/",
    definition: "Lasting for a very short time.",
    example:
      "The beauty of the cherry blossoms is ephemeral, lasting only a few days.",
    image:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
  },
  {
    id: "4",
    word: "Luminous",
    pronunciation: "/ˈluː.mɪ.nəs/",
    definition:
      "Full of or shedding light; bright or shining, especially in the dark.",
    example: "The full moon was luminous in the clear night sky.",
    image:
      "https://images.unsplash.com/photo-1506456044677-44f24eb066c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=764&q=80",
  },
  {
    id: "5",
    word: "Solitude",
    pronunciation: "/ˈsɒl.ɪ.tjuːd/",
    definition:
      "The state of being alone, especially when this is peaceful and pleasant.",
    example: "She enjoyed the solitude of a walk on the beach.",
    image:
      "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "6",
    word: "Aurora",
    pronunciation: "/ɔːˈrɔː.rə/",
    definition:
      "A natural electrical phenomenon characterized by the appearance of streamers of reddish or greenish light in the sky.",
    example: "We traveled north to see the aurora borealis.",
    image:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "7",
    word: "Ethereal",
    pronunciation: "/iˈθɪə.ri.əl/",
    definition:
      "Extremely delicate and light in a way that seems too perfect for this world.",
    example: "Her ethereal beauty captivated everyone in the room.",
    image:
      "https://images.unsplash.com/photo-1512418490979-92798cec1380?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "8",
    word: "Ineffable",
    pronunciation: "/ɪnˈef.ə.bəl/",
    definition: "Too great or extreme to be expressed or described in words.",
    example: "The ineffable beauty of the Grand Canyon left us speechless.",
    image:
      "https://images.unsplash.com/photo-1499558943461-8b7445c06e23?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "9",
    word: "Mellifluous",
    pronunciation: "/meˈlɪf.lu.əs/",
    definition: "(of a voice or words) sweet or musical; pleasant to hear.",
    example: "She had a rich, mellifluous voice that soothed the audience.",
    image:
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "10",
    word: "Sonder",
    pronunciation: "/ˈsɒn.dər/",
    definition:
      "The realization that each random passerby is living a life as vivid and complex as your own.",
    example: "Sitting in the busy cafe, I was struck by a moment of sonder.",
    image:
      "https://images.unsplash.com/photo-1478144592103-25e218a04891?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
  },
];

export default function SwipeScreen() {
  const { isDark } = useTheme();
  const [data, setData] = useState(DUMMY_DATA);
  const [lastDirection, setLastDirection] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const swipeRef = useRef<TinderSwipeRef>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      // Reset the data to initial state when screen gains focus
      setData([...DUMMY_DATA]);
      setLastDirection(null);
      setIsFinished(false);
    }, [])
  );

  const onSwipeRight = (item: VocabularyCard) => {
    setLastDirection("Right");
    console.log("Swiped right on:", item.word);
  };

  const onSwipeLeft = (item: VocabularyCard) => {
    setLastDirection("Left");
    console.log("Swiped left on:", item.word);
  };

  const handleRestart = () => {
    setData([...DUMMY_DATA]);
    setIsFinished(false);
  };

  const handleQuiz = () => {
    router.push("/quiz");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Stack.Screen options={{ title: "Voca" }} />
      <View style={styles.swipeContainer}>
        <View
          style={{
            flex: 1,
            width: "100%",
            display: isFinished ? "none" : "flex",
          }}
        >
          <TinderSwipe
            ref={swipeRef}
            data={data}
            renderCard={(item) => <SwipeCardItem item={item} />}
            onSwipeRight={onSwipeRight}
            onSwipeLeft={onSwipeLeft}
            loop={false}
            onRunOutOfCards={() => setIsFinished(true)}
          />
        </View>
        {isFinished && (
          <View style={styles.finishedContainer}>
            <Text
              style={[styles.finishedText, { color: isDark ? "#fff" : "#000" }]}
            >
              You&apos;ve reached the end!
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.quizButton]}
                onPress={handleQuiz}
              >
                <Text style={styles.buttonText}>Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.restartButton]}
                onPress={handleRestart}
              >
                <Text style={styles.buttonText}>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
  finishedContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  finishedText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quizButton: {
    backgroundColor: "#28a745",
  },
  restartButton: {
    backgroundColor: "#007bff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
