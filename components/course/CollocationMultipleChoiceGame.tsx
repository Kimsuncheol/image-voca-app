import React from "react";
import { MultipleChoiceGame } from "./MultipleChoiceGame";

type CollocationMultipleChoiceGameProps = React.ComponentProps<
  typeof MultipleChoiceGame
>;

export function CollocationMultipleChoiceGame(
  props: CollocationMultipleChoiceGameProps,
) {
  return <MultipleChoiceGame {...props} />;
}
