import React from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "../themed-text";
import { styles } from "./subscriptionBadgeStyles";

export function VocaUnlimitedSection() {
  const { t } = useTranslation();

  return (
    <ThemedText style={[styles.planName, styles.currentPlan]}>
      {t("plans.voca_unlimited.name")} • {t("subscription.status.active")}
    </ThemedText>
  );
}
