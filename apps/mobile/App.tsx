import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Workflows } from "./src/components/workflows";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { ApiError, getSession, hasSavedSession, signIn, signOut, websiteUrl } from "./src/api";

function Button({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={[styles.buttonText, secondary && { color: "#12392f" }]}>{label}</Text>
  </Pressable>;
}

function Workspace() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retrySession, setRetrySession] = useState(false);

  function handleError(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 401) {
      setSession(null); setRetrySession(false);
    }
    setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
  }

  async function restore() {
    setBusy(true); setError("");
    try {
      if (await hasSavedSession()) {
        setSession(await getSession()); setRetrySession(false);
      }
    } catch (cause) {
      setRetrySession(!(cause instanceof ApiError && cause.status === 401));
      handleError(cause);
    } finally { setBusy(false); }
  }
  useEffect(() => { void restore(); }, []);

  async function login() {
    setBusy(true); setError("");
    try {
      await signIn(email.trim(), password);
      setPassword("");
      // If profile loading fails, retry the saved session rather than creating
      // another server session on each retry.
      setRetrySession(true);
      setSession(await getSession()); setRetrySession(false);
    } catch (cause) { handleError(cause); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try {
      await signOut(); setSession(null); setRetrySession(false);
    } catch (cause) { handleError(cause); }
    finally { setBusy(false); }
  }

  async function openWebsite() {
    try { await Linking.openURL(`${websiteUrl()}/login`); }
    catch (cause) { handleError(cause); }
  }

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><Text style={styles.logo}>E</Text><Text style={styles.brandText}>EstateDesk</Text></View>
        <Text style={styles.eyebrow}>YOUR PROPERTY WORKSPACE</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {busy ? <ActivityIndicator accessibilityLabel="Loading" color="#14634e" style={{ marginVertical: 12 }} /> : null}

        {!session ? <>
          <Text style={styles.title}>{retrySession ? "Reconnect to your workspace" : "Welcome back"}</Text>
          <Text style={styles.subtitle}>Your properties, bills, and everyday tasks in one place.</Text>
          {retrySession ? <>
            <Button label="Try again" onPress={() => void restore()} disabled={busy} />
            <Button label="Sign out" onPress={() => void logout()} disabled={busy} secondary />
          </> : <View style={styles.card}>
            <Text style={styles.label}>Email or username</Text>
            <TextInput accessibilityLabel="Email or username" style={styles.input} value={email} onChangeText={setEmail}
              autoCapitalize="none" autoCorrect={false} textContentType="username" autoComplete="username" editable={!busy} />
            <Text style={styles.label}>Password</Text>
            <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword}
              secureTextEntry textContentType="password" autoComplete="current-password" editable={!busy}
              onSubmitEditing={() => { if (!busy && email.trim() && password) void login(); }} />
            <Button label={busy ? "Signing in…" : "Sign in"} onPress={() => void login()}
              disabled={busy || !email.trim() || !password} />
          </View>}
          <Button label="Account help on the website" onPress={() => void openWebsite()} secondary />
        </> : <Workflows key={`${session.organizationId}:${session.role}`} session={session}
          refreshSession={async () => { setError(""); setSession(await getSession()); }}
          onError={handleError} logout={() => void logout()} />}

      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export default function App() {
  return <SafeAreaProvider><Workspace /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f6f3" },
  content: { padding: 24, paddingBottom: 48, gap: 16, width: "100%", maxWidth: 600, alignSelf: "center", flexGrow: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 22 },
  logo: { backgroundColor: "#14634e", color: "white", fontSize: 24, fontWeight: "800", paddingHorizontal: 13, paddingVertical: 6, borderRadius: 12 },
  brandText: { fontSize: 24, fontWeight: "700", color: "#12392f" },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: "#597066", fontWeight: "700" },
  title: { fontSize: 32, fontWeight: "700", color: "#12392f" },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#53675e" },
  card: { backgroundColor: "white", padding: 22, borderRadius: 20, borderWidth: 1, borderColor: "#dee6df", gap: 14 },
  cardTitle: { fontSize: 20, color: "#12392f", fontWeight: "600" },
  label: { color: "#243d33", fontSize: 15, fontWeight: "500" },
  input: { minHeight: 50, borderWidth: 1, borderColor: "#a4b7ab", borderRadius: 10, paddingHorizontal: 14, color: "#12392f", fontSize: 17 },
  button: { backgroundColor: "#14634e", borderRadius: 12, minHeight: 50, padding: 14, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#e3ece5" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", padding: 16, borderRadius: 12, lineHeight: 22 },
  balance: { backgroundColor: "#12392f", borderRadius: 20, padding: 24, gap: 8 },
  balanceLabel: { color: "#d9e9df", fontSize: 14 },
  balanceAmount: { color: "white", fontSize: 32, fontWeight: "700" },
  status: { color: "#14634e", fontWeight: "600", fontSize: 13 },
});
