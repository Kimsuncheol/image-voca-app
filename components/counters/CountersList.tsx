import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { CounterWord } from "../../src/types/counters";
import { CounterRow } from "./CounterRow";
import { ElementaryTable } from "../elementary-japanese/ElementaryTable";

interface Props {
  data: CounterWord[];
  loading: boolean;
  error: string | null;
  showFurigana: boolean;
}

export function CountersList({ data, loading, error, showFurigana }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <ElementaryTable
          columns={[
            {
              key: "counter",
              label: t("counters.colCounter"),
              style: styles.counterColumn,
            },
            {
              key: "meaning",
              label: t("counters.colMeaning"),
              style: styles.meaningColumn,
            },
            {
              key: "pronunciation",
              label: t("counters.colPronun"),
              style: styles.pronunColumn,
            },
            {
              key: "example",
              label: t("counters.colExample"),
              style: styles.exampleColumn,
            },
          ]}
          loading={loading}
          error={error}
          hasData={data.length > 0}
          emptyMessage={t("counters.empty", {
            defaultValue: "No counters found.",
          })}
        >
          {data.map((item, index) => (
            <CounterRow
              key={item.id}
              item={item}
              index={index}
              showFurigana={showFurigana}
            />
          ))}
        </ElementaryTable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 12,
  },
  counterColumn: {
    flex: 0.85,
  },
  meaningColumn: {
    flex: 0.85,
  },
  pronunColumn: {
    flex: 1.15,
    paddingLeft: 6,
    paddingRight: 4,
  },
  exampleColumn: {
    flex: 1.15,
    paddingLeft: 6,
    paddingRight: 0,
  },
});
