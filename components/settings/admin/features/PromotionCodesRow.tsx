import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../AdminNavRow";

interface PromotionCodesRowProps {
  styles: any;
  isDark: boolean;
  t: (key: string) => string;
}

export const PromotionCodesRow: React.FC<PromotionCodesRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.admin.promotionCodes")}
      icon="gift-outline"
      onPress={() => router.push("/admin/promotion-codes")}
      isDark={isDark}
      styles={styles}
    />
  );
};
