import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface AdminSectionProps {
  styles: any;
  user: any;
  t: (key: string) => string;
}

export const AdminSection: React.FC<AdminSectionProps> = ({
  styles,
  user,
  t,
}) => {
  const router = useRouter();

  if (
    user?.email?.toLowerCase() !== "benjaminadmin@example.com".toLowerCase()
  ) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Admin</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/admin/add-voca")}
        >
          <View style={styles.optionLeft}>
            <Text style={styles.optionText}>Add Vocabulary</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
