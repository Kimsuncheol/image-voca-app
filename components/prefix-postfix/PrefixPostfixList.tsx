import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { PrefixWord, PostfixWord } from "../../src/types/prefixPostfix";
import { ElementaryTable } from "../elementary-japanese/ElementaryTable";
import type { Tab } from "./PrefixPostfixTabs";
import { PrefixPostfixRow } from "./PrefixPostfixRow";

interface Props {
  tab: Tab;
  data: (PrefixWord | PostfixWord)[];
  loading: boolean;
  error: string | null;
}

export function PrefixPostfixList({ tab, data, loading, error }: Props) {
  const { t } = useTranslation();

  const colHeader = tab === "prefix"
    ? t("prefixPostfix.colPrefix")
    : t("prefixPostfix.colPostfix");

  return (
    <View style={styles.tableWrapper}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ElementaryTable
          columns={[
            { key: "word", label: colHeader, style: styles.wordColumn },
            {
              key: "meaning",
              label: t("prefixPostfix.colMeaning"),
              style: styles.meaningColumn,
            },
            {
              key: "pronunciation",
              label: t("prefixPostfix.colPronun"),
              style: styles.pronunColumn,
            },
            {
              key: "example",
              label: t("prefixPostfix.colExample"),
              style: styles.exampleColumn,
            },
          ]}
          loading={loading}
          error={error}
          hasData={data.length > 0}
          emptyMessage={t("prefixPostfix.empty", {
            defaultValue: "No prefix/postfix data found.",
          })}
        >
          {data.map((item, index) => (
            <PrefixPostfixRow
              key={item.id}
              item={item}
              tab={tab}
              index={index}
            />
          ))}
        </ElementaryTable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    flex: 1,
    marginHorizontal: 0,
  },
  wordColumn: {
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
