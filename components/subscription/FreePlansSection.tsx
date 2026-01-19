import React from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../themed-text";
import { styles } from "./subscriptionBadgeStyles";

export function FreePlansSection() {
  const { t } = useTranslation();

  return (
    <>
      <ThemedText style={styles.planName}>{t("plans.free.name")}</ThemedText>
      <ThemedText style={styles.planName}>
        {t("plans.voca_unlimited.name")}
      </ThemedText>
      <ThemedText style={styles.planName}>
        {t("plans.voca_speaking.name")}
      </ThemedText>
    </>
  );
}
