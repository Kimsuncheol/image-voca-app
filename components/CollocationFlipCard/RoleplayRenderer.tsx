import React, { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { parseRoleplaySegments } from "../../src/utils/roleplayUtils";
import { RoleplayDialogueRow } from "../RoleplayDialogueRow";

interface RoleplayRendererProps {
  content: string;
  isDark: boolean;
  renderText?: (text: string) => React.ReactNode;
}

export const RoleplayRenderer: React.FC<RoleplayRendererProps> = React.memo(
  ({ content, isDark, renderText }) => {
    // Memoize segment parsing
    const segments = useMemo(() => parseRoleplaySegments(content), [content]);

    // Memoize combined text styles to avoid recreating arrays on every render
    const textStyle = useMemo(
      () =>
        [styles.value, isDark && styles.textDark, styles.exampleText].filter(
          Boolean,
        ),
      [isDark],
    );

    const dialogueTextStyle = useMemo(
      () =>
        [
          styles.value,
          isDark && styles.textDark,
          styles.exampleText,
          styles.normalFont,
        ].filter(Boolean),
      [isDark],
    );

    // Memoize the entire nodes array creation
    const nodes = useMemo(() => {
      if (!segments) return null;

      const result = [];
      let i = 0;

      while (i < segments.length) {
        const segment = segments[i];

        if (segment.type === "role") {
          let textContent = "";
          if (i + 1 < segments.length && segments[i + 1].type === "text") {
            textContent = segments[i + 1].content;
            i += 2;
          } else {
            i += 1;
          }

          result.push(
            <RoleplayDialogueRow
              key={`d-${i}`}
              role={segment.content}
              text={
                renderText ? (
                  renderText(textContent)
                ) : (
                  <Text style={dialogueTextStyle}>
                    &quot;{textContent}&quot;
                  </Text>
                )
              }
            />,
          );
        } else {
          result.push(
            renderText ? (
              <React.Fragment key={`t-${i}`}>
                {renderText(segment.content)}
              </React.Fragment>
            ) : (
              <Text key={`t-${i}`} style={textStyle}>
                &quot;{segment.content}&quot;
              </Text>
            ),
          );
          i += 1;
        }
      }

      return result;
    }, [segments, dialogueTextStyle, textStyle, renderText]);

    if (!nodes) return null;
    return <>{nodes}</>;
  },
);

RoleplayRenderer.displayName = "RoleplayRenderer";

const styles = StyleSheet.create({
  value: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "400",
  },
  textDark: {
    color: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  exampleText: {
    fontStyle: "italic",
    flex: 1,
    marginRight: 8,
  },
  normalFont: {
    fontStyle: "normal",
  },
});
