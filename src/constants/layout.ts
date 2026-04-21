import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const CARD_HEIGHT = SCREEN_HEIGHT * 0.76;
export const CARD_WIDTH = SCREEN_WIDTH * 0.9;
export { SCREEN_HEIGHT, SCREEN_WIDTH };

