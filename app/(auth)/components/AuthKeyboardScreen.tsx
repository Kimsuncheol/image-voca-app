import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const KEYBOARD_EXTRA_SCROLL_PADDING = 32;

interface AuthKeyboardScreenProps {
  children: React.ReactNode;
  containerStyle: StyleProp<ViewStyle>;
  contentContainerStyle: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
}

export const AuthKeyboardScreen: React.FC<AuthKeyboardScreenProps> = ({
  children,
  containerStyle,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
}) => {
  return (
    <SafeAreaView style={containerStyle}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={[
            contentContainerStyle,
            styles.keyboardScrollPadding,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  keyboardScrollPadding: {
    paddingBottom: KEYBOARD_EXTRA_SCROLL_PADDING,
  },
});
