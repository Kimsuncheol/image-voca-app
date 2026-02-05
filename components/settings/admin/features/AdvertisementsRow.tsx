import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../AdminNavRow";

interface AdvertisementsRowProps {
  styles: any;
  isDark: boolean;
  t: (key: string) => string;
}

export const AdvertisementsRow: React.FC<AdvertisementsRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.admin.advertisements")}
      icon="megaphone-outline"
      onPress={() => router.push("/admin/advertisements")}
      isDark={isDark}
      styles={styles}
    />
  );
};
