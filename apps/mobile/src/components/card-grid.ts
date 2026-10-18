import { useState } from "react";
import { PixelRatio, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from "react-native";

/** Measure usable space, including landscape and split-screen changes. */
export function useCardGrid() {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const minimum = 144 * Math.max(1, fontScale);
  const columns = Math.max(1, Math.min(4, Math.floor((width + 12) / (minimum + 12))));
  const scale = PixelRatio.get();
  const cellWidth = Math.floor(Math.max(0, (width - 12 * (columns - 1)) / columns) * scale) / scale;
  return {
    onLayout: (event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth > 0) setWidth(nextWidth);
    },
    cell: { width: width > 0 ? cellWidth : "100%" as const, flexGrow: 0, flexShrink: 0 },
  };
}

export const cardGridStyles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "stretch", gap: 12 },
  card: {
    backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dce6e0",
    borderRadius: 18, padding: 16, gap: 12, minHeight: 184,
    boxShadow: "0px 2px 6px rgba(18, 57, 47, 0.06)",
  },
  pressed: { backgroundColor: "#edf5f0", borderColor: "#79a38c", transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  footer: { marginTop: "auto", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e8eee9", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  footerText: { color: "#236446", fontSize: 12, fontWeight: "600" },
});
