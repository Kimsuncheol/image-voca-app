import { render } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { InlineMeaningWithChips } from "../components/common/InlineMeaningWithChips";

describe("InlineMeaningWithChips", () => {
  it("uses POS/text columns for multiline meanings", () => {
    const { getByTestId, getByText, queryByTestId, queryByText } = render(
      <InlineMeaningWithChips
        meaning={"a. 1. 합리적인, 타당한\n 2. (가격 따위가) 비싸지 않은"}
        isDark={false}
        testID="inline-meaning"
      />,
    );

    const firstRowStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-0").props.style,
    );
    const firstPosColumn = getByTestId("inline-meaning-pos-column-0");
    const secondPosColumn = getByTestId("inline-meaning-pos-column-1");
    const firstPosColumnStyle = StyleSheet.flatten(firstPosColumn.props.style);
    const secondPosColumnStyle = StyleSheet.flatten(secondPosColumn.props.style);
    const firstTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-0").props.style,
    );
    const secondTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-1").props.style,
    );

    expect(getByText("a")).toBeTruthy();
    expect(getByText(" 1. 합리적인, 타당한")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("(가격 따위가) 비싸지 않은")).toBeTruthy();
    expect(queryByText("a.")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeTruthy();
    expect(queryByTestId("inline-meaning-text-column-0")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeTruthy();
    expect(queryByTestId("inline-meaning-text-column-1")).toBeTruthy();
    expect(firstRowStyle.flexDirection).toBe("row");
    expect(firstPosColumnStyle.width).toBe(secondPosColumnStyle.width);
    expect(firstTextColumnStyle.flex).toBe(1);
    expect(secondTextColumnStyle.flex).toBe(1);
    expect(secondPosColumn.props.children ?? null).toBeNull();
  });

  it("keeps single-line meanings in inline flow", () => {
    const { getByTestId, queryByTestId } = render(
      <InlineMeaningWithChips
        meaning="n. 불꽃, 번쩍임 v. 번쩍이다."
        isDark={false}
        testID="inline-meaning"
      />,
    );

    const firstLineStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-0").props.style,
    );

    expect(firstLineStyle.flexWrap).toBe("wrap");
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
  });

  it("splits single-line POS groups into wrapped rows when opted in", () => {
    const { getByTestId, getByText, queryByText } = render(
      <InlineMeaningWithChips
        meaning="v. 진행하다, 나아가다, 계속되다 n. 진행, 계속됨"
        isDark={false}
        testID="inline-meaning"
        splitPosSegmentsIntoRows
      />,
    );

    const firstLineStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-0").props.style,
    );
    const secondLineStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-line-1").props.style,
    );
    const firstTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-0").props.style,
    );
    const secondTextColumnStyle = StyleSheet.flatten(
      getByTestId("inline-meaning-text-column-1").props.style,
    );

    expect(getByText("v")).toBeTruthy();
    expect(getByText("n")).toBeTruthy();
    expect(getByText("진행하다, 나아가다, 계속되다")).toBeTruthy();
    expect(getByText("진행, 계속됨")).toBeTruthy();
    expect(queryByText("v.")).toBeNull();
    expect(queryByText("n.")).toBeNull();
    expect(queryByText("|")).toBeNull();
    expect(firstLineStyle.flexDirection).toBe("row");
    expect(secondLineStyle.flexDirection).toBe("row");
    expect(firstTextColumnStyle.flex).toBe(1);
    expect(firstTextColumnStyle.flexWrap).toBe("wrap");
    expect(secondTextColumnStyle.flex).toBe(1);
    expect(secondTextColumnStyle.flexWrap).toBe("wrap");
  });

  it("renders numbered CSAT idiom meanings without POS indentation", () => {
    const { getByText, queryByTestId } = render(
      <InlineMeaningWithChips
        meaning="1. ~할 예정이다 2. ~할 것 같다"
        courseId="CSAT_IDIOMS"
        isDark={false}
        testID="inline-meaning"
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("~할 예정이다")).toBeTruthy();
    expect(getByText("~할 것 같다")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeNull();
    expect(queryByTestId("inline-meaning-text-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-text-column-1")).toBeNull();
  });

  it("renders numbered extremely advanced meanings without POS indentation", () => {
    const { getByText, queryByTestId } = render(
      <InlineMeaningWithChips
        meaning="1. ~할 예정이다 2. ~할 것 같다"
        courseId="EXTREMELY_ADVANCED"
        isDark={false}
        testID="inline-meaning"
      />,
    );

    expect(getByText("1. ")).toBeTruthy();
    expect(getByText("2. ")).toBeTruthy();
    expect(getByText("~할 예정이다")).toBeTruthy();
    expect(getByText("~할 것 같다")).toBeTruthy();
    expect(queryByTestId("inline-meaning-pos-column-0")).toBeNull();
    expect(queryByTestId("inline-meaning-pos-column-1")).toBeNull();
  });
});
