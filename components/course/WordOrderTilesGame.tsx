import React from "react";
import { WordArrangementGame } from "./WordArrangementGame";

type WordOrderTilesGameProps = React.ComponentProps<typeof WordArrangementGame>;

export function WordOrderTilesGame(props: WordOrderTilesGameProps) {
  return <WordArrangementGame {...props} />;
}
