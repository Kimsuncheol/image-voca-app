import React from "react";
import { MatchingGame } from "./MatchingGame";

type CollocationMatchingGameProps = React.ComponentProps<typeof MatchingGame>;

export function CollocationMatchingGame(
  props: CollocationMatchingGameProps,
) {
  return <MatchingGame {...props} />;
}
