declare module "react-native-flip-card" {
  import { Component } from "react";
  import { StyleProp, ViewStyle } from "react-native";

  export interface FlipCardProps {
    style?: StyleProp<ViewStyle>;
    friction?: number;
    perspective?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    clickable?: boolean;
    onFlipEnd?: (isFlipped: boolean) => void;
    onFlipStart?: (isFlipped: boolean) => void;
    alignHeight?: boolean;
    alignWidth?: boolean;
    useNativeDriver?: boolean;
    children?: React.ReactNode;
  }

  export default class FlipCard extends Component<FlipCardProps> {}
}
