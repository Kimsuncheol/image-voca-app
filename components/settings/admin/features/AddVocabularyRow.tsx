import { useRouter } from "expo-router";
import React from "react";
import { AdminNavRow } from "../AdminNavRow";

interface AddVocabularyRowProps {
  styles: any;
  isDark: boolean;
  t: (key: string) => string;
}

export const AddVocabularyRow: React.FC<AddVocabularyRowProps> = ({
  styles,
  isDark,
  t,
}) => {
  const router = useRouter();

  return (
    <AdminNavRow
      title={t("settings.admin.addVocabulary")}
      icon="add-circle-outline"
      onPress={() => router.push("/admin/add-voca")}
      isDark={isDark}
      styles={styles}
    />
  );
};
