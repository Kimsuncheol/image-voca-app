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

const POS_COLUMN_WIDTH = 36;

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
}: InlineMeaningWithChipsProps) {
  const formattedMeaning = React.useMemo(
    () => formatIdiomMeaningForDisplay(meaning, courseId),
    [courseId, meaning],
  );
  const parsedMeaning = parseMeaningPartsOfSpeech(formattedMeaning);
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const useColumnLayout =
    !forceInline &&
    parsedMeaning.lines.length > 1 &&
    (!isNumberedMeaningDisplayCourseId(courseId) ||
      parsedMeaning.hasPartsOfSpeech);

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {parsedMeaning.lines.map((line, lineIndex) =>
        useColumnLayout ? (
          <View
            key={`line-${lineIndex}`}
            style={[styles.columnRow, lineStyle]}
            testID={testID ? `${testID}-line-${lineIndex}` : undefined}
          >
            {renderColumnLine(
              line,
              lineIndex,
              textColor,
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
            {renderInlineLine(line, textColor, textStyle, prefixStyle, chipStyle)}
          </View>
        ),
      )}
    </View>
  );
}

function renderInlineLine(
  line: MeaningLine,
  textColor: string,
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
          {renderSegment(segment, textColor, textStyle, chipStyle)}
        </React.Fragment>
      ))}
    </>
  );
}

function renderColumnLine(
  line: MeaningLine,
  lineIndex: number,
  textColor: string,
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
        {posSegment ? renderSegment(posSegment, textColor, textStyle, chipStyle) : null}
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
            {renderSegment(segment, textColor, textStyle, chipStyle)}
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

function renderSegment(
  segment: MeaningSegment,
  textColor: string,
  textStyle?: StyleProp<TextStyle>,
  chipStyle?: StyleProp<ViewStyle>,
) {
  if (segment.type === "pos") {
    return (
      <View style={[styles.chip, { borderColor: textColor }, chipStyle]}>
        <Text style={[styles.chipLabel, { color: textColor }]}>{segment.value}</Text>
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
    marginRight: 6,
    borderWidth: 1,
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
