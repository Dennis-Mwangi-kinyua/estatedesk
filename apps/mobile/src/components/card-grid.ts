import { mobileTheme } from "../design-tokens";
import { cardGridLayout } from "../grid-layout";
import { useState } from "react";
import { PixelRatio, StyleSheet, useWindowDimensions, type LayoutChangeEvent } from "react-native";

/** Measure usable space, including landscape and split-screen changes. */
export function useCardGrid() {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const { cellWidth, columns } = cardGridLayout(width, fontScale, PixelRatio.get());
  return {
    columns,
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
    backgroundColor: mobileTheme.color.surface, borderWidth: 1, borderColor: mobileTheme.color.border,
    borderRadius: mobileTheme.radius.card, padding: 16, gap: 12, minHeight: 160,
  },
  pressed: { backgroundColor: mobileTheme.color.soft, borderColor: mobileTheme.color.brand },
  disabled: { opacity: 0.5 },
  footer: { marginTop: "auto", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e8eee9", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  footerText: { color: "#236446", fontSize: 12, fontWeight: "600" },
});
