import { Children, type ReactNode } from "react";
import { Platform, useWindowDimensions, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { AppIcon, type AppIconName } from "./app-icon";

export function Button({ label, onPress, disabled, secondary, checked, selected, icon }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; checked?: boolean; selected?: boolean; icon?: AppIconName }) {
  return <Pressable accessibilityRole={checked === undefined ? "button" : "checkbox"} accessibilityState={{ disabled: !!disabled, ...(checked === undefined ? {} : { checked }), ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    {icon ? <AppIcon name={icon} color={secondary ? undefined : "#ffffff"} size={19} /> : null}<Text style={[styles.buttonText, secondary && { color: "#12392f" }]}>{label}</Text>
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
  title: { fontSize: 27, lineHeight: 35, letterSpacing: -0.5, fontWeight: "700", color: "#12392f" },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#53675e" },
  card: { minWidth: 0, backgroundColor: "white", padding: 18, borderRadius: 20, borderWidth: 1, borderColor: "#dce6df", gap: 16, boxShadow: "0px 2px 8px rgba(18, 57, 47, 0.04)" },
  cardTitle: { fontSize: 18, lineHeight: 25, color: "#12392f", fontWeight: "600" },
  label: { color: "#243d33", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  input: { minHeight: 50, borderWidth: 1, backgroundColor: "#f8faf9", borderColor: "#cddbd2", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#12392f", fontSize: 16 },
  button: { maxWidth: "100%", flexShrink: 1, flexDirection: "row", gap: 9, backgroundColor: "#14634e", borderRadius: 12, minHeight: 50, padding: 14, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#e3ece5" },
  buttonText: { textAlign: "center", flexShrink: 1, color: "white", fontSize: 16, fontWeight: "600" },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", padding: 16, borderRadius: 12, lineHeight: 22 },
});
