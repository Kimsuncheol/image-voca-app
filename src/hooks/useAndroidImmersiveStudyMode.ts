import { useFocusEffect } from "@react-navigation/native";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import type {
  NavigationBarBehavior,
  NavigationBarVisibility,
} from "expo-navigation-bar";
import React from "react";
import { Platform } from "react-native";

const IMMERSIVE_NAVIGATION_BAR_BEHAVIOR: NavigationBarBehavior =
  "overlay-swipe";
const DEFAULT_NAVIGATION_BAR_BEHAVIOR: NavigationBarBehavior = "inset-touch";
const HIDDEN_NAVIGATION_BAR_VISIBILITY: NavigationBarVisibility = "hidden";
const VISIBLE_NAVIGATION_BAR_VISIBILITY: NavigationBarVisibility = "visible";

export function useAndroidImmersiveStudyMode(keepAwakeTag: string): void {
  useFocusEffect(
    React.useCallback(() => {
      void activateKeepAwakeAsync(keepAwakeTag).catch((error) => {
        console.warn("Failed to activate keep awake mode:", error);
      });

      if (Platform.OS === "android") {
        void NavigationBar.setBehaviorAsync(IMMERSIVE_NAVIGATION_BAR_BEHAVIOR)
          .then(() =>
            NavigationBar.setVisibilityAsync(HIDDEN_NAVIGATION_BAR_VISIBILITY),
          )
          .catch((error) => {
            console.warn("Failed to enable immersive study mode:", error);
          });
      }

      return () => {
        void deactivateKeepAwake(keepAwakeTag).catch((error) => {
          console.warn("Failed to deactivate keep awake mode:", error);
        });

        if (Platform.OS === "android") {
          void NavigationBar.setVisibilityAsync(
            VISIBLE_NAVIGATION_BAR_VISIBILITY,
          )
            .then(() =>
              NavigationBar.setBehaviorAsync(DEFAULT_NAVIGATION_BAR_BEHAVIOR),
            )
            .catch((error) => {
              console.warn("Failed to restore navigation bar:", error);
            });
        }
      };
    }, [keepAwakeTag]),
  );
}
