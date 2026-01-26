import React from "react";
import { FillInTheBlankGame } from "./FillInTheBlankGame";

type CollocationGapFillSentenceGameProps = React.ComponentProps<
  typeof FillInTheBlankGame
>;

export function CollocationGapFillSentenceGame(
  props: CollocationGapFillSentenceGameProps,
) {
  return <FillInTheBlankGame {...props} />;
}
