import { Children, type ReactNode } from "react";
import { Platform, useWindowDimensions, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { AppIcon, type AppIconName } from "./app-icon";

export const mobileTheme = {
  color: {
    canvas: "#f3f6f3", surface: "#ffffff", brand: "#14634e", brandDark: "#123c32",
    ink: "#12392f", text: "#53675e", muted: "#62766a", border: "#dce6df", soft: "#e3ece5",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { control: 12, card: 18, panel: 24 },
} as const;

export function Button({ label, onPress, disabled, secondary, checked, selected, icon }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; checked?: boolean; selected?: boolean; icon?: AppIconName }) {
  return <Pressable accessibilityRole={checked === undefined ? "button" : "checkbox"} accessibilityState={{ disabled: !!disabled, ...(checked === undefined ? {} : { checked }), ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    {icon ? <AppIcon name={icon} color={secondary ? undefined : mobileTheme.color.surface} size={19} /> : null}<Text style={[styles.buttonText, secondary && { color: mobileTheme.color.ink }]}>{label}</Text>
  </Pressable>;
}
export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><TextInput inputAccessoryViewID={Platform.OS === "ios" ? "estatedesk-input-toolbar" : undefined} accessibilityLabel={label} style={[styles.input, props.multiline && { textAlignVertical: "top", minHeight: 112 }, style]} {...props} /></View>;
}
/** Wide forms use balanced field pairs; phone and larger-text layouts stack. */
export function FormColumns({ children }: { children: ReactNode }) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 768 && fontScale <= 1.35;
  return <View style={{ flexDirection: wide ? "row" : "column", gap: 16, alignItems: "stretch" }}>
    {Children.toArray(children).map((child, index) => <View key={index} style={wide ? { flex: 1, minWidth: 0 } : undefined}>{child}</View>)}
  </View>;
}
export const styles = StyleSheet.create({
  title: { fontSize: 27, lineHeight: 35, letterSpacing: -0.5, fontWeight: "700", color: mobileTheme.color.ink },
  subtitle: { fontSize: 14, lineHeight: 22, color: mobileTheme.color.text },
  card: { minWidth: 0, backgroundColor: mobileTheme.color.surface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: mobileTheme.color.border, gap: 16, boxShadow: "0px 2px 8px rgba(18, 57, 47, 0.04)" },
  cardTitle: { fontSize: 18, lineHeight: 25, color: mobileTheme.color.ink, fontWeight: "600" },
  label: { color: "#243d33", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  input: { minHeight: 50, borderWidth: 1, backgroundColor: "#f8faf9", borderColor: "#cddbd2", borderRadius: mobileTheme.radius.control, paddingHorizontal: 14, paddingVertical: 12, color: mobileTheme.color.ink, fontSize: 16 },
  button: { maxWidth: "100%", flexShrink: 1, flexDirection: "row", gap: 9, backgroundColor: mobileTheme.color.brand, borderRadius: mobileTheme.radius.control, minHeight: 50, padding: 14, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: mobileTheme.color.soft },
  buttonText: { textAlign: "center", flexShrink: 1, color: mobileTheme.color.surface, fontSize: 16, fontWeight: "600" },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", padding: 16, borderRadius: 12, lineHeight: 22 },
});
