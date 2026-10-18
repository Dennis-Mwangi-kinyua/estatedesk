import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { OfflineWorkspace } from "./src/components/offline-workspace";
import { Workflows } from "./src/components/workflows";
import { TenantWorkspace } from "./src/components/tenant-workspace";
import { TenantNavigation, type TenantTab } from "./src/components/tenant-navigation";
import type { MobileSession, MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import { ApiError, getSession, getCachedSession, hasSavedSession, signIn, signOut, websiteUrl } from "./src/api";

function Button({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={[styles.buttonText, secondary && { color: "#12392f" }]}>{label}</Text>
  </Pressable>;
}

function Workspace() {
  const { width } = useWindowDimensions();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const previousScreen = useRef("home");
  const [tenantTab, setTenantTab] = useState<TenantTab>("home");
  const chooseTenantTab = useCallback((tab: TenantTab) => {
    Keyboard.dismiss(); setTenantTab(tab); scroll.current?.scrollTo({ y: 0, animated: false });
  }, []);
  const [tenantHome, setTenantHome] = useState({ visible: true, busy: false });
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const onNavigationChange = useCallback((screen: string, working: boolean) => {
    setTenantHome({ visible: screen === "home", busy: working });
    if (previousScreen.current !== screen) { scroll.current?.scrollTo({ y: 0, animated: false }); previousScreen.current = screen; }
  }, []);
  useEffect(() => {
    const shown = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  const [workspace, setWorkspace] = useState<{ kind: "tenant" | MobileWorkspaceKind; path: string } | null>(null);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const [offline, setOffline] = useState(false);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retrySession, setRetrySession] = useState(false);

  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 401) {
      setSession(null); setRetrySession(false);
    }
    setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
  }, []);

  const restore = useCallback(async () => {
    try {
      const saved = await hasSavedSession();
      setError("");
      if (saved) {
        setSession(await getSession()); setOffline(false); setRetrySession(false);
      }
    } catch (cause) {
      if (!(cause instanceof ApiError)) {
        const cached = await getCachedSession();
        if (cached) { setSession(cached); setOffline(true); setRetrySession(false); return; }
      }
      setRetrySession(!(cause instanceof ApiError && cause.status === 401));
      handleError(cause);
    } finally { setBusy(false); }
  }, [handleError]);
  useEffect(() => {
    // Restore from external keychain/server state once when the app mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore();
  }, [restore]);

  async function login() {
    Keyboard.dismiss();
    setBusy(true); setError("");
    try {
      await signIn(email.trim(), password);
      setTenantTab("home");
      setPassword("");
      // If profile loading fails, retry the saved session rather than creating
      // another server session on each retry.
      setRetrySession(true);
      setSession(await getSession()); setOffline(false); setRetrySession(false);
    } catch (cause) { handleError(cause); }
    finally { setBusy(false); }
  }

  async function logout() {
    Keyboard.dismiss();
    setBusy(true); setError("");
    try {
      await signOut(); setWorkspace(null); setTenantTab("home"); setSession(null); setRetrySession(false);
    } catch (cause) { handleError(cause); }
    finally { setBusy(false); }
  }

  async function openWebsite() {
    try { await Linking.openURL(`${websiteUrl()}/login`); }
    catch (cause) { handleError(cause); }
  }

  return <SafeAreaView style={styles.safe}>
    {workspace && session && !offline && !session.requiresAccountSetup ? <TenantWorkspace kind={workspace.kind} initialPath={workspace.path} onError={handleError} close={() => {
      setWorkspace(null); setWorkspaceRevision(value => value + 1); setBusy(true); void restore();
    }} /> : null}
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingHorizontal: width < 360 ? 16 : 24 }, session && { maxWidth: 1100 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        refreshControl={session?.role === "TENANT" && tenantHome.visible && !offline && !session.requiresAccountSetup ? <RefreshControl refreshing={busy} enabled={!tenantHome.busy} tintColor="#14634e" colors={["#14634e"]} onRefresh={() => { if (!busy && !tenantHome.busy) { setBusy(true); void restore(); } }} /> : undefined}>
        <View style={[styles.brand, session && { marginVertical: 4 }, session?.role === "TENANT" && { justifyContent: "center" }]}><Text style={styles.logo}>E</Text><Text style={styles.brandText}>EstateDesk</Text></View>
        {!session ? <Text style={styles.eyebrow}>YOUR PROPERTY WORKSPACE</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {busy ? <ActivityIndicator accessibilityLabel="Loading" color="#14634e" style={{ marginVertical: 12 }} /> : null}

        {!session ? <>
          <Text style={styles.title}>{retrySession ? "Reconnect to your workspace" : "Welcome back"}</Text>
          <Text style={styles.subtitle}>Your properties, bills, and everyday tasks in one place.</Text>
          {retrySession ? <>
            <Button label="Try again" onPress={() => { setBusy(true); void restore(); }} disabled={busy} />
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
        </> : offline ? <OfflineWorkspace session={session} reconnect={async () => { setSession(await getSession()); setOffline(false); setError(""); }} onError={handleError} logout={() => void logout()} /> : <Workflows key={`${session.userId}:${session.organizationId}:${session.role}:${session.platformRole}:${workspaceRevision}`} session={session}
          tenantTab={tenantTab} selectTenantTab={chooseTenantTab} onNavigationChange={onNavigationChange}
          openTenantWorkspace={path => { Keyboard.dismiss(); setWorkspace({ kind: "tenant", path: path ?? "/dashboard/tenant" }); }}
          openWorkspace={(kind, path) => { Keyboard.dismiss(); setWorkspace({ kind, path }); }}
          refreshSession={async () => { setError(""); setSession(await getSession()); }}
          onError={handleError} logout={() => void logout()} />}

      </ScrollView>
    </KeyboardAvoidingView>
    {session?.role === "TENANT" && tenantHome.visible && !offline && !session.requiresAccountSetup && !workspace && !keyboardVisible ? <TenantNavigation selected={tenantTab} disabled={busy || tenantHome.busy}
      select={chooseTenantTab}
      account={() => chooseTenantTab("account")} /> : null}
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
  input: { minHeight: 50, borderWidth: 1, borderColor: "#a4b7ab", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#12392f", fontSize: 17 },
  button: { backgroundColor: "#14634e", borderRadius: 12, minHeight: 50, padding: 14, alignItems: "center", justifyContent: "center" },
  secondary: { backgroundColor: "#e3ece5" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  error: { backgroundColor: "#fce9e7", color: "#8f261f", padding: 16, borderRadius: 12, lineHeight: 22 },
  balance: { backgroundColor: "#12392f", borderRadius: 20, padding: 24, gap: 8 },
  balanceLabel: { color: "#d9e9df", fontSize: 14 },
  balanceAmount: { color: "white", fontSize: 32, fontWeight: "700" },
  status: { color: "#14634e", fontWeight: "600", fontSize: 13 },
});
