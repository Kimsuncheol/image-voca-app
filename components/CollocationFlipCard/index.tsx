import React, { useState } from "react";
import { StyleSheet } from "react-native";
import FlipCard from "react-native-flip-card";
import BackSide from "./BackSide";
import FaceSide from "./FaceSide";
import { CollocationData } from "./types";

interface Props {
  data: CollocationData;
  isDark?: boolean;
}

export const CollocationFlipCard: React.FC<Props> = ({
  data,
  isDark = false,
}) => {
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
      <FaceSide data={data} isDark={isDark} />

      {/* Back Side */}
      <BackSide data={data} isDark={isDark} isVisible={isBackVisible} />
    </FlipCard>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 480,
    width: "90%",
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "transparent",
  },
});

export default CollocationFlipCard;
