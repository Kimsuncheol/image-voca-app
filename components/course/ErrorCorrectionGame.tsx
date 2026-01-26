import React from "react";
import { MultipleChoiceGame } from "./MultipleChoiceGame";

type ErrorCorrectionGameProps = React.ComponentProps<typeof MultipleChoiceGame>;

export function ErrorCorrectionGame({
  questionLabel = "Fix the incorrect collocation",
  roleplay,
  word,
  ...props
}: ErrorCorrectionGameProps) {
  const resolvedRoleplay = roleplay ?? word;
  return (
    <MultipleChoiceGame
      {...props}
      roleplay={resolvedRoleplay}
      questionLabel={questionLabel}
      questionLabelStyle={{ fontSize: 11 }}
      contentStyle={{ fontSize: 16, fontWeight: "light", textAlign: "left" }}
    />
  );
}
