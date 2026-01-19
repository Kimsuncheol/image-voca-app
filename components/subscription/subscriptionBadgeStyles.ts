import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumContainer: {
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
  },
  upgradeHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    color: "#34C759",
    marginTop: 2,
    fontWeight: "600",
  },
  currentPlan: {
    color: "#34C759",
  },
});
