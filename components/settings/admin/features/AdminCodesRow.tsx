import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../AdminNavRow";

interface AdminCodesRowProps {
  styles: any;
  isDark: boolean;
  t: (key: string) => string;
}

export const AdminCodesRow: React.FC<AdminCodesRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.admin.adminCodes")}
      icon="shield-checkmark-outline"
      onPress={() => router.push("/admin/admin-codes")}
      isDark={isDark}
      styles={styles}
      showSeparator={false}
    />
  );
};
