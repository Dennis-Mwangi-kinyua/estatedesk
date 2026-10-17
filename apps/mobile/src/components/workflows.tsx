import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { enablePush } from "../notifications";
import { ActivityIndicator, Alert, Linking, Text, View } from "react-native";
import type { MobileSession, MobileBills, MobileIssues, MobileMeters } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, styles } from "./ui";

type Screen = "home" | "bills" | "issues" | "meters" | "organizations" | "notifications" | "payment" | "history";
type Bill = MobileBills["bills"][number];

export function Workflows({ session, refreshSession, onError, logout }: {
  session: MobileSession; refreshSession: () => Promise<void>; onError: (error: unknown) => void; logout: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [bills, setBills] = useState<MobileBills | null>(null);
  const [issues, setIssues] = useState<MobileIssues | null>(null);
  const [meters, setMeters] = useState<MobileMeters | null>(null);
  const [memberships, setMemberships] = useState<Awaited<ReturnType<typeof api.getMemberships>>>([]);
  const [notifications, setNotifications] = useState<Awaited<ReturnType<typeof api.getNotifications>>>([]);
  const [methods, setMethods] = useState<Awaited<ReturnType<typeof api.getPaymentMethods>>>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.getPaymentHistory>>>([]);
  const [bill, setBill] = useState<Bill | null>(null);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reading, setReading] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  useEffect(() => {
    const listener = Notifications.addNotificationResponseReceivedListener(() => { void load("notifications"); });
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) { void load("notifications"); void Notifications.clearLastNotificationResponseAsync(); }
    }).catch(onError);
    return () => listener.remove();
    // Register once per mounted organization workspace; opening a notification always fetches current authorized data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setNotice("");
    try { await action(); } catch (error) { onError(error); } finally { busyRef.current = false; setBusy(false); }
  }
  async function load(target: Screen) {
    await run(async () => {
      if (target === "bills") setBills(await api.getBills());
      if (target === "issues") { setIssues(await api.getIssues()); setUnitId(""); }
      if (target === "meters") { setMeters(await api.getMeters()); setUnitId(""); }
      if (target === "organizations") setMemberships(await api.getMemberships());
      if (target === "notifications") setNotifications(await api.getNotifications());
      if (target === "history") setHistory(await api.getPaymentHistory());
      setScreen(target);
    });
  }
  const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: bills?.currencyCode ?? session.currencyCode }).format(value);
  const chooseUnit = (id: string) => { setUnitId(id); setReading(""); setNotes(""); };

  function pay() {
    if (!bill || !method) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > bill.balance) { onError(new Error("Enter an amount within the outstanding balance.")); return; }
    Alert.alert("Confirm payment", `${money(value)} using ${methods.find(item => item.id === method)?.name}. ${method === "mpesa-stk" ? "A prompt will be sent to your phone." : "Your organization must verify your payment before the balance changes."}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: () => void run(async () => {
        await api.submitPayment({ source: bill.source === "PERIOD_BILL" ? "period_bill" : bill.source === "WATER_BILL" ? "water_bill" : "rent_charge", id: bill.source === "PERIOD_BILL" ? bill.period : bill.id, method: method as "mpesa-stk" | "manual-mpesa" | "manual-bank", amount: value, phoneNumber: phone, accountName, transactionId: reference, proofMessage: proof });
        setScreen("bills"); setBill(null); setReference(""); setProof("");
        setNotice(method === "mpesa-stk" ? "Check your phone for the M-Pesa prompt. Refresh bills after confirmation. Check payment history before retrying an uncertain payment." : "Payment submitted for organization verification. Your balance changes after approval.");
      }) },
    ]);
  }

  return <>
    {busy ? <ActivityIndicator accessibilityLabel="Loading workspace" color="#14634e" /> : null}
    {notice ? <Text accessibilityRole="alert" style={styles.subtitle}>{notice}</Text> : null}
    {screen !== "home" ? <Button label="Back to home" onPress={() => { setScreen("home"); setNotice(""); }} disabled={busy} secondary /> : null}
    {session.requiresAccountSetup ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Complete account setup</Text>
      {session.mustChangePassword ? <>
        <Field label="Temporary password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} editable={!busy} />
        <Field label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} editable={!busy} />
        <Field label="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!busy} />
      </> : null}
      <Button label="Read terms" onPress={() => void Linking.openURL(`${api.websiteUrl()}/terms`).catch(onError)} secondary />
      <Button label="Read privacy notice" onPress={() => void Linking.openURL(`${api.websiteUrl()}/privacy`).catch(onError)} secondary />
      <Button label="I accept the terms of use" checked={acceptedTerms} onPress={() => setAcceptedTerms(!acceptedTerms)} disabled={busy} secondary />
      <Button label="Complete setup" disabled={busy || !acceptedTerms} onPress={() => void run(async () => {
        await api.completeSetup({ currentPassword, newPassword, confirmPassword, acceptedTerms: true });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); await refreshSession();
      })} />
    </View> : screen === "home" ? <>
      <Text style={styles.title}>Hello, {session.fullName.split(" ")[0]}</Text>
      <Text style={styles.subtitle}>{session.organizationName ?? "EstateDesk"} · {session.role?.replaceAll("_", " ")}</Text>
      {session.role === "TENANT" ? <>
        {session.canViewBills ? <Button label="View bills and pay" onPress={() => void load("bills")} disabled={busy} /> : null}
        <Button label="Payment history" onPress={() => void load("history")} disabled={busy} secondary />
        <Button label="Maintenance requests" onPress={() => void load("issues")} disabled={busy} />
      </> : session.role === "CARETAKER" ? <Button label="Submit meter readings" onPress={() => void load("meters")} disabled={busy} /> : null}
      <Button label="Notifications" onPress={() => void load("notifications")} disabled={busy} secondary />
      <Button label="Switch organization" onPress={() => void load("organizations")} disabled={busy} secondary />
      <Button label="Open website" onPress={() => void Linking.openURL(`${api.websiteUrl()}/login`).catch(onError)} secondary />
    </> : screen === "bills" ? <>
      <Text style={styles.title}>Your bills</Text>
      <Text style={styles.cardTitle}>Outstanding: {money(bills?.totalBalance ?? 0)}</Text>
      {bills?.bills.length === 0 ? <Text style={styles.subtitle}>No bills to show yet.</Text> : null}
      {bills?.bills.map(item => <View key={item.id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.label} · {item.period}</Text>
        <Text style={styles.subtitle}>Due {new Date(item.dueDate).toLocaleDateString("en-KE")} · {item.status}</Text>
        <Text style={styles.label}>Billed: {money(item.amountDue)} · Balance: {money(item.balance)}</Text>
        {item.balance > 0 && item.source ? <Button label={`Pay ${item.period}`} disabled={busy} onPress={() => void run(async () => {
          setMethods(await api.getPaymentMethods()); setBill(item); setAmount(String(item.balance)); setMethod(""); setReference(""); setProof(""); setScreen("payment");
        })} /> : null}
      </View>)}
      <Button label="Refresh bills" onPress={() => void load("bills")} disabled={busy} secondary />
    </> : screen === "history" ? <>
      <Text style={styles.title}>Payment history</Text>
      {history.length === 0 ? <Text style={styles.subtitle}>No payments submitted yet.</Text> : null}
      {history.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{money(item.amount)}</Text><Text style={styles.subtitle}>{item.gatewayStatus} · {item.verificationStatus}</Text><Text style={styles.subtitle}>{item.reference ?? "Awaiting provider reference"} · {new Date(item.createdAt).toLocaleDateString("en-KE")}</Text></View>)}
      <Button label="Refresh payment history" onPress={() => void load("history")} disabled={busy} secondary />
    </> : screen === "payment" ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Pay {bill?.period}</Text>
      <Field label="Payment amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!busy} />
      {methods.length === 0 ? <Text style={styles.subtitle}>No mobile payment methods are enabled. Contact your organization.</Text> : null}
      {methods.map(item => <Button key={item.id} label={`${method === item.id ? "✓ " : ""}${item.name}`} onPress={() => setMethod(item.id)} disabled={busy} secondary={method !== item.id} />)}
      {method ? <>
        <Text style={styles.subtitle}>{methods.find(item => item.id === method)?.instructions}</Text>
        {method !== "manual-bank" ? <Field label="M-Pesa phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!busy} /> : <Field label="Sender or account name" value={accountName} onChangeText={setAccountName} editable={!busy} />}
        {method !== "mpesa-stk" ? <>
          <Field label="Transaction reference" value={reference} onChangeText={setReference} autoCapitalize="characters" editable={!busy} />
          <Field label="Confirmation SMS or bank message (optional)" value={proof} onChangeText={setProof} multiline maxLength={5000} editable={!busy} />
        </> : null}
        <Button label="Review and submit payment" onPress={pay} disabled={busy} />
      </> : null}
    </View> : screen === "issues" ? <>
      <Text style={styles.title}>Maintenance requests</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report a problem</Text>
        {issues?.units.map(unit => <Button key={unit.id} label={`${unitId === unit.id ? "✓ " : ""}${unit.label}`} onPress={() => chooseUnit(unit.id)} disabled={busy} secondary />)}
        {issues?.units.length === 0 ? <Text style={styles.subtitle}>An active lease is required to report a problem.</Text> : null}
        <Field label="Issue title" value={title} onChangeText={setTitle} maxLength={200} editable={!busy} />
        <Field label="Describe the problem" value={description} onChangeText={setDescription} multiline maxLength={5000} editable={!busy} />
        <Button label="Submit request" disabled={busy || !unitId || !title.trim() || !description.trim()} onPress={() => void run(async () => {
          await api.submitIssue({ unitId, title, description, priority: "MEDIUM" }); setTitle(""); setDescription(""); setIssues(await api.getIssues()); setNotice("Maintenance request submitted.");
        })} />
      </View>
      {issues?.issues.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.status} · {item.priority}</Text><Text style={styles.subtitle}>{item.description}</Text></View>)}
      <Button label="Refresh requests" onPress={() => void load("issues")} disabled={busy} secondary />
    </> : screen === "meters" ? <>
      <Text style={styles.title}>Meter readings · {meters?.period}</Text>
      {meters?.units.length === 0 ? <Text style={styles.subtitle}>No assigned occupied units are awaiting readings.</Text> : null}
      {meters?.units.map(unit => <View key={unit.id} style={styles.card}>
        <Button label={`${unitId === unit.id ? "✓ " : ""}${unit.label}`} onPress={() => chooseUnit(unit.id)} disabled={busy} secondary />
        <Text style={styles.subtitle}>Previous reading: {unit.previousReading}</Text>
        {unitId === unit.id ? <>
          <Field label="Current reading" keyboardType="number-pad" value={reading} onChangeText={setReading} editable={!busy} />
          <Field label="Reading notes (optional)" value={notes} onChangeText={setNotes} maxLength={500} editable={!busy} />
          <Button label="Submit for approval" disabled={busy || !reading.trim() || !Number.isInteger(Number(reading)) || Number(reading) < unit.previousReading} onPress={() => void run(async () => {
            await api.submitReading({ unitId, period: meters.period, currentReading: Number(reading), notes }); setMeters(await api.getMeters()); setUnitId(""); setNotice("Reading submitted for organization approval.");
          })} />
        </> : null}
      </View>)}
      <Button label="Refresh meters" onPress={() => void load("meters")} disabled={busy} secondary />
    </> : screen === "organizations" ? <>
      <Text style={styles.title}>Your organizations</Text>
      {memberships.map(item => <Button key={item.id} label={`${item.organizationId === session.organizationId && item.role === session.role ? "Current: " : ""}${item.organizationName} · ${item.role}`} disabled={busy} onPress={() => void run(async () => {
        await api.switchMembership(item.id); setBills(null); setIssues(null); setMeters(null); setNotifications([]); setBill(null); setScreen("home"); await refreshSession();
      })} secondary />)}
    </> : screen === "notifications" ? <>
      <Text style={styles.title}>Notifications</Text>
      <Button label="Enable device notifications" disabled={busy} onPress={() => void run(async () => { await enablePush(); setNotice("Device notifications enabled for this organization. Logout or session revocation removes registration."); })} />
      <Button label="Disable device notifications" disabled={busy} onPress={() => void run(async () => { await api.disablePush(); setNotice("Device notifications disabled."); })} secondary />
      {notifications.length === 0 ? <Text style={styles.subtitle}>No notifications yet.</Text> : null}
      {notifications.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.message}</Text>{!item.readAt ? <Button label="Mark as read" disabled={busy} onPress={() => void run(async () => { await api.readNotification(item.id); setNotifications(await api.getNotifications()); })} secondary /> : <Text style={styles.subtitle}>Read</Text>}</View>)}
      <Button label="Refresh notifications" onPress={() => void load("notifications")} disabled={busy} secondary />
    </> : null}
    <Button label="Sign out" onPress={logout} disabled={busy} secondary />
  </>;
}
