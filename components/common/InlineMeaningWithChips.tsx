import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import {
  formatIdiomMeaningForDisplay,
  isNumberedMeaningDisplayCourseId,
} from "../../src/utils/idiomDisplay";
import {
  parseMeaningPartsOfSpeech,
  type MeaningLine,
  type MeaningSegment,
} from "../../src/utils/meaningPartsOfSpeech";

const POS_COLUMN_WIDTH = 28;
const PREFIX_COLUMN_WIDTH = 26;

interface InlineMeaningWithChipsProps {
  meaning: string;
  courseId?: string;
  isDark: boolean;
  textStyle?: StyleProp<TextStyle>;
  prefixStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  lineStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  testID?: string;
  forceInline?: boolean;
  splitPosSegmentsIntoRows?: boolean;
  usePrefixColumnLayout?: boolean;
}

export function InlineMeaningWithChips({
  meaning,
  courseId,
  isDark,
  textStyle,
  prefixStyle,
  containerStyle,
  lineStyle,
  chipStyle,
  testID,
  forceInline = false,
  splitPosSegmentsIntoRows = false,
  usePrefixColumnLayout = false,
}: InlineMeaningWithChipsProps) {
  const formattedMeaning = React.useMemo(
    () => formatIdiomMeaningForDisplay(meaning, courseId),
    [courseId, meaning],
  );
  const parsedMeaning = parseMeaningPartsOfSpeech(formattedMeaning);
  const displayLines = React.useMemo(
    () =>
      splitPosSegmentsIntoRows
        ? splitLinesByPartsOfSpeech(parsedMeaning.lines)
        : parsedMeaning.lines,
    [parsedMeaning.lines, splitPosSegmentsIntoRows],
  );
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const posTextColor = isDark ? "#D1D5DB" : "#4B5563";
  const usePrefixColumns =
    usePrefixColumnLayout && displayLines.some((line) => line.linePrefix);
  const useColumnLayout =
    !usePrefixColumns &&
    !usePrefixColumnLayout &&
    !forceInline &&
    (displayLines.length > 1 ||
      (splitPosSegmentsIntoRows && parsedMeaning.hasPartsOfSpeech)) &&
    (!isNumberedMeaningDisplayCourseId(courseId) ||
      parsedMeaning.hasPartsOfSpeech);

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {displayLines.map((line, lineIndex) =>
        usePrefixColumns ? (
          <View
            key={`line-${lineIndex}`}
            style={[styles.prefixColumnRow, lineStyle]}
            testID={testID ? `${testID}-line-${lineIndex}` : undefined}
          >
            {renderPrefixColumnLine(
              line,
              lineIndex,
              textColor,
              posTextColor,
              textStyle,
              prefixStyle,
              chipStyle,
              testID,
            )}
          </View>
        ) : useColumnLayout ? (
          <View
            key={`line-${lineIndex}`}
            style={[styles.columnRow, lineStyle]}
            testID={testID ? `${testID}-line-${lineIndex}` : undefined}
          >
            {renderColumnLine(
              line,
              lineIndex,
              textColor,
              posTextColor,
              textStyle,
              prefixStyle,
              chipStyle,
              testID,
            )}
          </View>
        ) : (
          <View
            key={`line-${lineIndex}`}
            style={[styles.line, lineStyle]}
            testID={testID ? `${testID}-line-${lineIndex}` : undefined}
          >
            {renderInlineLine(
              line,
              textColor,
              posTextColor,
              textStyle,
              prefixStyle,
              chipStyle,
            )}
          </View>
        ),
      )}
    </View>
  );
}

function renderPrefixColumnLine(
  line: MeaningLine,
  lineIndex: number,
  textColor: string,
  posTextColor: string,
  textStyle?: StyleProp<TextStyle>,
  prefixStyle?: StyleProp<TextStyle>,
  chipStyle?: StyleProp<ViewStyle>,
  testID?: string,
) {
  return (
    <>
      <View
        style={styles.prefixColumn}
        testID={testID ? `${testID}-prefix-column-${lineIndex}` : undefined}
      >
        {line.linePrefix ? (
          <Text
            style={[
              styles.baseText,
              { color: textColor },
              textStyle,
              styles.prefix,
              prefixStyle,
            ]}
          >
            {line.linePrefix}
          </Text>
        ) : null}
      </View>
      <View
        style={styles.prefixTextColumn}
        testID={testID ? `${testID}-text-column-${lineIndex}` : undefined}
      >
        {line.segments.map((segment, segmentIndex) => (
          <React.Fragment key={`prefix-segment-${lineIndex}-${segmentIndex}`}>
            {renderSegment(
              segment,
              textColor,
              posTextColor,
              textStyle,
              chipStyle,
            )}
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

function splitLinesByPartsOfSpeech(lines: MeaningLine[]): MeaningLine[] {
  return lines.flatMap((line) => {
    const posSegmentIndexes = line.segments
      .map((segment, index) => (segment.type === "pos" ? index : -1))
      .filter((index) => index >= 0);

    if (posSegmentIndexes.length === 0) {
      return [line];
    }

    return posSegmentIndexes.map((posIndex, rowIndex) => {
      const nextPosIndex = posSegmentIndexes[rowIndex + 1] ?? line.segments.length;
      const rowSegments = line.segments
        .slice(posIndex, nextPosIndex)
        .map((segment, segmentIndex) => {
          if (segment.type !== "text" || segmentIndex !== 1) {
            return segment;
          }

          return {
            ...segment,
            value: segment.value.trim(),
          };
        })
        .filter((segment) => segment.type !== "text" || segment.value.length > 0);

      return {
        linePrefix: rowIndex === 0 ? line.linePrefix : undefined,
        segments: rowSegments,
      };
    });
  });
}

function renderInlineLine(
  line: MeaningLine,
  textColor: string,
  posTextColor: string,
  textStyle?: StyleProp<TextStyle>,
  prefixStyle?: StyleProp<TextStyle>,
  chipStyle?: StyleProp<ViewStyle>,
) {
  return (
    <>
      {line.linePrefix ? (
        <Text
          style={[
            styles.baseText,
            { color: textColor },
            textStyle,
            styles.prefix,
            prefixStyle,
          ]}
        >
          {`${line.linePrefix} `}
        </Text>
      ) : null}
      {line.segments.map((segment, segmentIndex) => (
        <React.Fragment key={`inline-segment-${segmentIndex}`}>
          {renderSegment(segment, textColor, posTextColor, textStyle, chipStyle)}
        </React.Fragment>
      ))}
    </>
  );
}

function renderColumnLine(
  line: MeaningLine,
  lineIndex: number,
  textColor: string,
  posTextColor: string,
  textStyle?: StyleProp<TextStyle>,
  prefixStyle?: StyleProp<TextStyle>,
  chipStyle?: StyleProp<ViewStyle>,
  testID?: string,
) {
  const posIndex = line.segments.findIndex((segment) => segment.type === "pos");
  const posSegment = posIndex >= 0 ? line.segments[posIndex] : null;
  const textSegments =
    posIndex >= 0
      ? line.segments.filter((_, index) => index !== posIndex)
      : line.segments;

  return (
    <>
      <View
        style={styles.posColumn}
        testID={testID ? `${testID}-pos-column-${lineIndex}` : undefined}
      >
        {posSegment
          ? renderSegment(
              posSegment,
              textColor,
              posTextColor,
              textStyle,
              chipStyle,
            )
          : null}
      </View>
      <View
        style={styles.textColumn}
        testID={testID ? `${testID}-text-column-${lineIndex}` : undefined}
      >
        {line.linePrefix ? (
          <Text
            style={[
              styles.baseText,
              { color: textColor },
              textStyle,
              styles.prefix,
              prefixStyle,
            ]}
          >
            {`${line.linePrefix} `}
          </Text>
        ) : null}
        {textSegments.map((segment, segmentIndex) => (
          <React.Fragment key={`column-segment-${lineIndex}-${segmentIndex}`}>
            {renderSegment(
              segment,
              textColor,
              posTextColor,
              textStyle,
              chipStyle,
            )}
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

function renderSegment(
  segment: MeaningSegment,
  textColor: string,
  posTextColor: string,
  textStyle?: StyleProp<TextStyle>,
  chipStyle?: StyleProp<ViewStyle>,
) {
  if (segment.type === "pos") {
    return (
      <View style={[styles.chip, chipStyle]}>
        <Text style={[styles.chipLabel, { color: posTextColor }]}>
          {segment.value}
        </Text>
      </View>
    );
  }

  return (
    <Text style={[styles.baseText, { color: textColor }, textStyle]}>
      {segment.value}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  line: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  columnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  prefixColumnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  prefixColumn: {
    width: PREFIX_COLUMN_WIDTH,
    minHeight: 24,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 1,
    paddingRight: 4,
  },
  prefixTextColumn: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  posColumn: {
    width: POS_COLUMN_WIDTH,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 2,
  },
  textColumn: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  baseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  prefix: {
    fontWeight: "600",
  },
  chip: {
    minHeight: 18,
    minWidth: 18,
    paddingHorizontal: 6,
    marginRight: 4,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    textTransform: "lowercase",
  },
});
