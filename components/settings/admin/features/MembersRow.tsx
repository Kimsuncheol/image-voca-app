import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../AdminNavRow";

interface MembersRowProps {
  styles: any;
  isDark: boolean;
  t: (key: string) => string;
}

export const MembersRow: React.FC<MembersRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.admin.members")}
      icon="people-outline"
      onPress={() => router.push("/admin/members")}
      isDark={isDark}
      styles={styles}
    />
  );
};
