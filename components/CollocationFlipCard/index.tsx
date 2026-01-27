import React, { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import FlipCard from "react-native-flip-card";
import BackSide from "./BackSide";
import FaceSide from "./FaceSide";
import { CollocationData, CollocationWordBankConfig } from "./types";

export { default as CollocationSkeleton } from "./CollocationSkeleton";

interface Props {
  data: CollocationData;
  isDark?: boolean;
  wordBankConfig?: CollocationWordBankConfig;
}

export const CollocationFlipCard: React.FC<Props> = React.memo(
  ({ data, isDark = false, wordBankConfig }) => {
    const [isBackVisible, setIsBackVisible] = useState(false);

    return (
      <FlipCard
        style={styles.card}
        friction={10}
        perspective={2000}
        flipHorizontal={true}
        flipVertical={false}
        clickable={true}
        onFlipEnd={setIsBackVisible}
      >
        {/* Face Side */}
        <FaceSide data={data} isDark={isDark} wordBankConfig={wordBankConfig} />

        {/* Back Side */}
        <BackSide data={data} isDark={isDark} isVisible={isBackVisible} />
      </FlipCard>
    );
  },
);

CollocationFlipCard.displayName = "CollocationFlipCard";

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  card: {
    minHeight: height * 0.7,
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
});

export default CollocationFlipCard;
