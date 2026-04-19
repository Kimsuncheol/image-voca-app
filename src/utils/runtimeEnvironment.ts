import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export const isExpoGoRuntime = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === "expo";

export const isAndroidExpoGoRuntime = () =>
  Platform.OS === "android" && isExpoGoRuntime();
