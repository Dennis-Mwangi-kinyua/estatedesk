import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import type { NativeGuestStay } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { Button, styles } from "./ui";

function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(+parsed) ? value : parsed.toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" });
}

export function NativeGuestStay({ back }: { back: () => void }) {
  const [stay, setStay] = useState<NativeGuestStay | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let active = true;
    void api.getGuestStay().then(value => { if (active) { setStay(value); setError(""); } }).catch(() => { if (active) setStay(null); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function login() {
    setBusy(true); setError(""); setNotice("");
    try { setStay(await api.signInGuestStay(code)); setCode(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Guest access could not be verified."); }
    finally { setBusy(false); }
  }
  async function submit() {
    setSending(true); setError(""); setNotice("");
    try { const result = await api.submitGuestStayRequest(message); setMessage(""); setNotice(result.message); setStay(await api.getGuestStay()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your request could not be sent."); }
    finally { setSending(false); }
  }
  async function logout() { await api.signOutGuestStay(); setStay(null); setNotice(""); setError(""); }
  return <View style={{ gap: 18 }}>
    <Button label="Back to sign in" icon="arrow-left" secondary onPress={back} />
    <View style={styles.card}><IconTile name="key" /><Text accessibilityRole="header" style={styles.title}>Guest stay access</Text><Text style={styles.subtitle}>Use the private access code provided by your host. Your code is stored securely on this device.</Text></View>
    {busy ? <View style={styles.card}><ActivityIndicator accessibilityLabel="Loading stay" color="#14634e" /><Text style={styles.subtitle}>Checking guest access…</Text></View> : null}
    {!stay && !busy ? <View style={styles.card}>
      <Text style={styles.label}>Guest access code</Text>
      <TextInput accessibilityLabel="Guest access code" autoCapitalize="none" autoCorrect={false} value={code} onChangeText={setCode} editable={!busy} style={styles.input} maxLength={64} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label={busy ? "Checking code…" : "Open my stay"} icon="key" disabled={busy || code.trim().length !== 43} onPress={() => void login()} />
    </View> : null}
    {stay ? <>
      <View style={[styles.card, { gap: 13 }]}><Text style={{ color: "#597066", fontSize: 11, letterSpacing: 1.6, fontWeight: "700" }}>YOUR RESERVATION</Text><Text accessibilityRole="header" style={styles.cardTitle}>{stay.listing}</Text><Text style={styles.subtitle}>{stay.location} · hosted by {stay.host}</Text>
        <View style={{ gap: 8 }}><Text style={styles.label}>Guest</Text><Text style={styles.subtitle}>{stay.guestName}</Text></View>
        <View style={{ gap: 8 }}><Text style={styles.label}>Check-in</Text><Text style={styles.subtitle}>{date(stay.checkIn)}</Text></View>
        <View style={{ gap: 8 }}><Text style={styles.label}>Check-out</Text><Text style={styles.subtitle}>{date(stay.checkOut)}</Text></View>
        <Button label="Sign out of this stay" icon="log-out" secondary onPress={() => void logout()} />
      </View>
      <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>Contact your host</Text><Text style={styles.subtitle}>Send a stay request or message. Only your host and authorized workspace staff can review it.</Text>
        <TextInput accessibilityLabel="Message to host" placeholder="How can your host help?" placeholderTextColor="#62766a" multiline maxLength={2000} value={message} onChangeText={setMessage} editable={!sending} style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]} />
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{notice}</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Button label={sending ? "Sending request…" : "Send request"} icon="send" disabled={sending || message.trim().length < 5} onPress={() => void submit()} />
      </View>
      <View style={{ gap: 10 }}><Text accessibilityRole="header" style={styles.cardTitle}>Recent requests</Text>{stay.requests.length ? stay.requests.map(item => <View key={item.id} style={styles.card}><View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><AppIcon name={item.resolved ? "check-circle" : "clock"} size={18} color={item.resolved ? "#14634e" : "#a36519"} /><Text style={styles.label}>{item.resolved ? "Resolved" : "Open"} · {date(item.createdAt)}</Text></View><Text style={styles.subtitle}>{item.message}</Text></View>) : <Text style={styles.subtitle}>No requests have been sent for this stay.</Text>}</View>
    </> : null}
  </View>;
}
