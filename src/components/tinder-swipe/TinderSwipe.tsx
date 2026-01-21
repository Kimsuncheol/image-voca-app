import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { TinderCard } from "./TinderCard";

export interface TinderSwipeRef {
  undo: () => void;
}

interface TinderSwipeProps {
  data: any[];
  renderCard: (item: any) => React.ReactNode;
  onSwipeLeft?: (item: any) => void;
  onSwipeRight?: (item: any) => void;
  onRunOutOfCards?: () => void;
  loop?: boolean;
}

export const TinderSwipe = forwardRef<TinderSwipeRef, TinderSwipeProps>(
  (
    {
      data,
      renderCard,
      onSwipeLeft,
      onSwipeRight,
      onRunOutOfCards,
      loop = false,
    },
    ref,
  ) => {
    const [cards, setCards] = useState(data);
    const historyRef = useRef<any[]>([]);

    useImperativeHandle(ref, () => ({
      undo: () => {
        const lastItem = historyRef.current.pop();
        if (lastItem) {
          setCards((prev) => [lastItem, ...prev]);
        }
      },
    }));

    useEffect(() => {
      setCards(data);
      historyRef.current = [];
    }, [data]);

    useEffect(() => {
      if (cards.length === 0 && !loop && onRunOutOfCards) {
        onRunOutOfCards();
      }
    }, [cards, loop, onRunOutOfCards]);

    const handleSwipeLeft = (index: number) => {
      const item = cards[index];
      if (onSwipeLeft) onSwipeLeft(item);
      setTimeout(() => {
        setCards((currentCards) => {
          const newCards = [...currentCards];
          const removed = newCards.splice(index, 1)[0];
          if (loop) {
            newCards.unshift(removed); // Put it at the bottom if looping
          } else {
            historyRef.current.push(removed);
          }
          return newCards;
        });
      }, 200);
    };

    const handleSwipeRight = (index: number) => {
      const item = cards[index];
      if (onSwipeRight) onSwipeRight(item);
      setTimeout(() => {
        setCards((currentCards) => {
          const newCards = [...currentCards];
          const removed = newCards.splice(index, 1)[0];
          if (loop) {
            newCards.unshift(removed);
          } else {
            historyRef.current.push(removed);
          }
          return newCards;
        });
      }, 200);
    };

    // We only render a few cards for performance and stacking logic
    // The last item in the array is on TOP visually in absolute positioning (if zIndex matches order)
    // BUT typically in stack implementations, the first item is top.
    // Let's stick to the mapping: reverse map so first item is on top?
    // Actually, standard map: last rendered is on top.
    // If `cards` is [A, B, C], and we map: A (bottom), B (middle), C (top).
    // So index 0 is bottom.

    // Wait, standard Tinder stacks usually have index 0 as TOP.
    // If index 0 is top, it must be rendered LAST in React Native View stack.

    // Let's render in reverse order of the array, so index 0 is rendered last (top).
    return (
      <View style={styles.container}>
        {cards.map((item, index) => {
          // Only render the top few cards for performance
          if (index > 2) return null; // Render index 0, 1, 2. Wait, if 0 is top.

          // Actually, let's reverse the array for rendering so the first element of 'cards' is rendered last (on top)
          return null;
        })}

        {cards
          .slice(0, 10)
          .reverse()
          .map((item, index, array) => {
            // array is reversed slice.
            // If original was [A, B, C...], slice is [A, B, C]. reversed is [C, B, A].
            // Render C (bottom), B (middle), A (top).
            // The item 'A' corresponds to original index 0.

            // We need the ID or key. Assuming item has id.
            const originalIndex = cards.indexOf(item);
            const isTop = item === cards[0];

            return (
              <View
                key={item.id || originalIndex}
                style={[styles.cardContainer, { zIndex: isTop ? 10 : 1 }]}
              >
                <TinderCard
                  onSwipeLeft={() => handleSwipeLeft(0)} // Always swipe the top card (which is index 0 of cards state)
                  onSwipeRight={() => handleSwipeRight(0)}
                >
                  {renderCard(item)}
                </TinderCard>
              </View>
            );
          })}
      </View>
    );
    // Correction: The logical swipe handler always removes index 0 (top card).
    // But inside the map, we need to correct the handlers.
    // If we render [C, B, A], only A (the last rendered) should be swipeable?
    // TinderCard handles gesture. If A covers B, only A receives touch? Yes (usually).
  },
);

TinderSwipe.displayName = "TinderSwipe";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
