import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface SignOutSectionProps {
  styles: Record<string, any>;
  onSignOut: () => void;
  t: (key: string) => string;
}

export function SignOutSection({ styles, onSignOut, t }: SignOutSectionProps) {
  return (
    <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
      <Text style={styles.signOutText}>{t("settings.account.signOut")}</Text>
    </TouchableOpacity>
  );
}
