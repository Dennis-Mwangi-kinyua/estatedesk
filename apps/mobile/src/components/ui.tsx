import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

export function Button({ label, onPress, disabled, secondary, checked, selected }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; checked?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole={checked === undefined ? "button" : "checkbox"} accessibilityState={{ disabled: !!disabled, ...(checked === undefined ? {} : { checked }), ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={[styles.buttonText, secondary && { color: "#12392f" }]}>{label}</Text>
  </Pressable>;
}
export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={[styles.input, props.multiline && { textAlignVertical: "top", minHeight: 112 }, style]} {...props} /></View>;
}
export const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "700", color: "#12392f" },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#53675e" },
  card: { minWidth: 0, backgroundColor: "white", padding: 18, borderRadius: 20, borderWidth: 1, borderColor: "#dee6df", gap: 14 },
  cardTitle: { fontSize: 20, color: "#12392f", fontWeight: "600" },
  label: { color: "#243d33", fontSize: 15, fontWeight: "500" },
  input: { minHeight: 50, borderWidth: 1, borderColor: "#a4b7ab", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#12392f", fontSize: 17 },
  button: { maxWidth: "100%", flexShrink: 1, backgroundColor: "#14634e", borderRadius: 12, minHeight: 50, padding: 14, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#e3ece5" },
  buttonText: { textAlign: "center", flexShrink: 1, color: "white", fontSize: 16, fontWeight: "600" },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", padding: 16, borderRadius: 12, lineHeight: 22 },
});
