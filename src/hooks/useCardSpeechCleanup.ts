import React from "react";
import { stopSpeech } from "../services/speechService";

export const stopAllCardSpeech = async (): Promise<void> => {
  await stopSpeech();
};

export function useCardSpeechCleanup(isActive: boolean = true) {
  const stopCardSpeech = React.useCallback(() => {
    void stopAllCardSpeech();
  }, []);

  React.useEffect(() => {
    if (isActive === false) {
      stopCardSpeech();
    }
  }, [isActive, stopCardSpeech]);

  React.useEffect(() => {
    return () => {
      stopCardSpeech();
    };
  }, [stopCardSpeech]);

  return stopCardSpeech;
}
