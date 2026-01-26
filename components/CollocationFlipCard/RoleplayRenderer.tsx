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
    const segments = useMemo(() => parseRoleplaySegments(content), [content]);
    if (!segments) return null;

    const nodes = [];
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

        nodes.push(
          <RoleplayDialogueRow
            key={`dialogue-${i}`}
            role={segment.content}
            text={
              renderText ? (
                renderText(textContent)
              ) : (
                <Text
                  style={[
                    styles.value,
                    isDark && styles.textDark,
                    styles.exampleText,
                    { fontStyle: "normal" }, // Reset italic for dialogue
                  ]}
                >
                  &quot;{textContent}&quot;
                </Text>
              )
            }
          />,
        );
      } else {
        nodes.push(
          renderText ? (
            <React.Fragment key={`text-${i}`}>
              {renderText(segment.content)}
            </React.Fragment>
          ) : (
            <Text
              key={`text-${i}`}
              style={[
                styles.value,
                isDark && styles.textDark,
                styles.exampleText,
              ]}
            >
              &quot;{segment.content}&quot;
            </Text>
          ),
        );
        i += 1;
      }
    }
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
});
