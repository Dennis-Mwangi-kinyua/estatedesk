import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { requestPasswordReset, resetPassword } from "../api";
import { mobileTheme } from "./ui";

export function NativePasswordRecovery({ back }: { back: () => void }) {
  const [step, setStep] = useState<"request" | "reset" | "complete">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitRequest() {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
      setStep("reset");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not request a reset link."); }
    finally { setBusy(false); }
  }

  async function submitReset() {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await resetPassword(token.trim(), password, confirmPassword);
      setPassword(""); setConfirmPassword(""); setMessage(result.message); setStep("complete");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not reset your password."); }
    finally { setBusy(false); }
  }

  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>{step === "complete" ? "Password updated" : "Reset your password"}</Text>
    <Text style={styles.subtitle}>{step === "request" ? "We’ll email a secure, time-limited reset link if an account exists for that address." : step === "reset" ? "Paste the link from your email or enter its reset token, then choose a new password." : "Your password has been changed. Sign in with the new password."}</Text>
    {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {step === "request" ? <>
      <Text style={styles.label}>Email address</Text>
      <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" value={email} onChangeText={setEmail} editable={!busy} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !email.trim()} onPress={() => void submitRequest()} style={[styles.primary, (busy || !email.trim()) && styles.disabled]}>
        {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Send reset link</Text>}
      </Pressable>
    </> : null}
    {step === "reset" ? <>
      <Text style={styles.label}>Reset link or token</Text>
      <TextInput accessibilityLabel="Reset link or token" autoCapitalize="none" autoCorrect={false} autoComplete="off" value={token} onChangeText={setToken} editable={!busy} style={styles.input} placeholder="Paste the link from your email" />
      <Text style={styles.label}>New password</Text>
      <TextInput accessibilityLabel="New password" secureTextEntry textContentType="newPassword" autoComplete="new-password" value={password} onChangeText={setPassword} editable={!busy} style={styles.input} />
      <Text style={styles.label}>Confirm new password</Text>
      <TextInput accessibilityLabel="Confirm new password" secureTextEntry textContentType="newPassword" autoComplete="new-password" value={confirmPassword} onChangeText={setConfirmPassword} editable={!busy} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !token.trim() || !password || !confirmPassword} onPress={() => void submitReset()} style={[styles.primary, (busy || !token.trim() || !password || !confirmPassword) && styles.disabled]}>
        {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Update password</Text>}
      </Pressable>
    </> : null}
    <Pressable accessibilityRole="button" onPress={step === "complete" ? back : step === "reset" ? () => { setStep("request"); setError(""); setMessage(""); } : back} style={styles.secondary}>
      <Text style={styles.secondaryText}>{step === "complete" || step === "request" ? "Back to sign in" : "Request another link"}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: mobileTheme.color.surface, borderColor: mobileTheme.color.border, borderWidth: 1, borderRadius: 20, padding: 22, gap: 14 },
  title: { color: mobileTheme.color.ink, fontSize: 24, fontWeight: "700" },
  subtitle: { color: mobileTheme.color.muted, fontSize: 15, lineHeight: 22 },
  label: { color: mobileTheme.color.ink, fontSize: 14, fontWeight: "600" },
  input: { minHeight: 50, borderWidth: 1, borderColor: mobileTheme.color.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: mobileTheme.color.ink, fontSize: 16, backgroundColor: "#fff" },
  primary: { minHeight: 50, borderRadius: 12, backgroundColor: mobileTheme.color.brand, alignItems: "center", justifyContent: "center", padding: 14 },
  primaryText: { color: "white", fontSize: 16, fontWeight: "600" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", backgroundColor: mobileTheme.color.canvas, borderRadius: 12, padding: 12 },
  secondaryText: { color: mobileTheme.color.brand, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.55 },
  success: { backgroundColor: "#e8f4ec", color: "#155d38", borderRadius: 10, padding: 13, fontSize: 14, lineHeight: 20 },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", borderRadius: 10, padding: 13, fontSize: 14, lineHeight: 20 },
});
