import { useState } from "react";
import { Alert, Image, Share, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as api from "../api";
import { Button, Field, styles } from "./ui";
type Run = (action: () => Promise<void>) => Promise<boolean>;
export function DocumentsPanel({ documents, busy, run, refresh }: { documents: Awaited<ReturnType<typeof api.getDocuments>>; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  return <><Text style={styles.title}>Receipts and lease documents</Text><Text style={styles.subtitle}>Verified receipts and available lease PDFs. Sharing saves a copy in the app you choose.</Text>
    {!documents.length ? <Text style={styles.subtitle}>No documents available yet.</Text> : null}
    {documents.map(doc => <View key={`${doc.kind}-${doc.id}`} style={styles.card}><Text style={styles.cardTitle}>{doc.title}</Text><Text style={styles.subtitle}>{new Date(doc.date).toLocaleDateString("en-KE")}</Text><Button label="View PDF" disabled={busy} onPress={() => void run(() => api.openDocument(doc.kind, doc.id, false))} /><Button label="Share or save PDF" secondary disabled={busy} onPress={() => void run(() => api.openDocument(doc.kind, doc.id, true))} /></View>)}
    <Button label="Refresh documents" secondary disabled={busy} onPress={() => void run(refresh)} />
  </>;
}
export function PaymentReviewPanel({ data, currency, busy, run, load }: { data: Awaited<ReturnType<typeof api.getReviewPayments>> | null; currency: string; busy: boolean; run: Run; load: (page: number) => Promise<void> }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  function review(id: string, action: "verify" | "reject", amount: string) {
    Alert.alert(action === "verify" ? "Verify this payment?" : "Reject this payment?", `${amount}. ${action === "verify" ? "Confirm the money has reached the organization account. Approval updates balances and issues a receipt." : "The tenant will receive your rejection reason."}`, [{ text: "Cancel", style: "cancel" }, { text: action === "verify" ? "Verify payment" : "Reject payment", onPress: () => void run(async () => { await api.reviewPayment(id, action, notes[id] ?? ""); setNotes({}); await load(1); }) }]);
  }
  return <><Text style={styles.title}>Payment review</Text><Text style={styles.subtitle}>Confirm references against your bank or M-Pesa records before approval. Automatic STK payments are handled by the gateway.</Text>
    {!data?.payments.length ? <Text style={styles.subtitle}>No pending manual payments in your scope.</Text> : null}
    {data?.payments.map(payment => { const amount = new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(payment.amount); return <View key={payment.id} style={styles.card}><Text style={styles.cardTitle}>{amount} · {payment.payer}</Text><Text style={styles.label}>{payment.method} · {payment.reference ?? "No reference"}</Text><Text style={styles.subtitle}>{new Date(payment.createdAt).toLocaleString("en-KE")}</Text><Text style={styles.subtitle}>Submitted evidence: {payment.proof ?? "No confirmation message supplied"}</Text><Field label="Verification note or rejection reason (required)" value={notes[payment.id] ?? ""} onChangeText={value => setNotes({ ...notes, [payment.id]: value })} maxLength={2000} multiline editable={!busy} /><Button label="Verify and issue receipt" disabled={busy || (notes[payment.id]?.trim().length ?? 0) < 5} onPress={() => review(payment.id, "verify", amount)} /><Button label="Reject with reason" secondary disabled={busy || (notes[payment.id]?.trim().length ?? 0) < 5} onPress={() => review(payment.id, "reject", amount)} /></View>; })}
    <Button label="Previous page" secondary disabled={busy || !data || data.page <= 1} onPress={() => void run(() => load((data?.page ?? 1) - 1))} /><Button label="Next page" secondary disabled={busy || !data?.hasMore} onPress={() => void run(() => load((data?.page ?? 1) + 1))} /><Button label="Refresh review queue" secondary disabled={busy} onPress={() => void run(() => load(1))} />
  </>;
}
export function VisitorsPanel({ visitors, busy, run, refresh }: { visitors: Awaited<ReturnType<typeof api.getVisitors>>; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [plate, setPlate] = useState(""); const [hours, setHours] = useState("2");
  const [created, setCreated] = useState<Awaited<ReturnType<typeof api.visitorAction>> | null>(null);
  return <><Text style={styles.title}>Visitor passes</Text><View style={styles.card}><Text style={styles.cardTitle}>Invite a visitor</Text><Field label="Visitor name" value={name} onChangeText={setName} maxLength={120} editable={!busy} /><Field label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={25} editable={!busy} /><Field label="Vehicle plate (optional)" value={plate} onChangeText={setPlate} maxLength={25} editable={!busy} /><Field label="Valid from now for hours (1–24)" value={hours} onChangeText={setHours} keyboardType="number-pad" editable={!busy} />
    <Button label="Create visitor QR pass" disabled={busy || name.trim().length < 2 || !Number.isInteger(Number(hours)) || Number(hours) < 1 || Number(hours) > 24} onPress={() => void run(async () => { const start = Date.now(); setCreated(await api.visitorAction({ action: "create", visitorName: name, visitorPhone: phone, vehiclePlate: plate, validFrom: new Date(start).toISOString(), validUntil: new Date(start + Number(hours) * 3600000).toISOString() })); setName(""); setPhone(""); setPlate(""); await refresh(); })} />
    </View>{created?.qr && created.url ? <View style={styles.card}><Text style={styles.cardTitle}>Keep this pass until the visit</Text><Image source={{ uri: created.qr }} alt="Visitor QR pass" accessibilityLabel="Visitor QR pass" style={{ width: 280, height: 280, maxWidth: "100%", alignSelf: "center" }} resizeMode="contain" /><Text style={styles.subtitle}>Only share this one-use invitation with your visitor. It cannot be retrieved after leaving this screen.</Text><Button label="Share visitor pass" disabled={busy} onPress={() => void run(async () => { await Share.share({ message: created.url!, url: created.url }); })} /></View> : null}
    {!visitors.length ? <Text style={styles.subtitle}>No recent visitor passes.</Text> : null}
    {visitors.map(pass => <View key={pass.id} style={styles.card}><Text style={styles.cardTitle}>{pass.visitorName} · {pass.status}</Text><Text style={styles.subtitle}>{new Date(pass.validFrom).toLocaleString("en-KE")} – {new Date(pass.validUntil).toLocaleString("en-KE")}</Text>{["READY", "UPCOMING"].includes(pass.status) ? <Button label="Revoke pass" disabled={busy} secondary onPress={() => Alert.alert("Revoke visitor pass?", "This invitation will no longer admit the visitor.", [{ text: "Cancel", style: "cancel" }, { text: "Revoke", style: "destructive", onPress: () => void run(async () => { await api.visitorAction({ action: "revoke", id: pass.id }); setCreated(null); await refresh(); }) }])} /> : null}</View>)}<Button label="Refresh passes" disabled={busy} secondary onPress={() => void run(refresh)} />
  </>;
}
export function GatePanel({ busy, run }: { busy: boolean; run: Run }) {
  const [permission, requestPermission] = useCameraPermissions(); const [scanning, setScanning] = useState(false); const [code, setCode] = useState("");
  const [pass, setPass] = useState<NonNullable<Awaited<ReturnType<typeof api.visitorAction>>["pass"]> | null>(null);
  function verify(value: string) {
    setScanning(false); setPass(null);
    void run(async () => {
      let token = value.trim();
      if (token.includes("#")) { const url = new URL(token); if (url.origin !== api.websiteUrl() || url.pathname !== "/dashboard/gate") throw new Error("Scan an EstateDesk visitor invitation."); token = new URLSearchParams(url.hash.slice(1)).get("pass") ?? ""; }
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Scan a valid visitor pass or paste its 43-character code.");
      const result = await api.visitorAction({ action: "verify", token }); setPass(result.pass ?? null); setCode("");
    });
  }
  return <><Text style={styles.title}>Gate admission</Text><Text style={styles.subtitle}>Check the visitor&apos;s identity against the pass before recording admission. A connection is required.</Text>
    <Button label="Scan visitor QR" disabled={busy} onPress={() => void run(async () => { setPass(null); if (permission?.granted || (await requestPermission()).granted) setScanning(true); else throw new Error("Allow camera access or paste the pass code."); })} />
    {scanning ? <><CameraView style={{ height: 300, borderRadius: 12 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={busy ? undefined : event => verify(event.data)} /><Button label="Cancel scan" secondary onPress={() => setScanning(false)} /></> : null}
    <Field label="Paste invitation link or pass code" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} editable={!busy} /><Button label="Check pass" disabled={busy || !code.trim()} onPress={() => verify(code)} />
    {pass ? <View style={styles.card}><Text style={styles.cardTitle}>{pass.visitorName} · {pass.status}</Text><Text style={styles.label}>{pass.property} / {pass.unit} · Visiting {pass.tenant}</Text><Text style={styles.subtitle}>{pass.visitorPhone ?? "No phone"} · {pass.vehiclePlate ?? "No vehicle"}</Text><Text style={styles.subtitle}>Valid {new Date(pass.validFrom).toLocaleString("en-KE")} – {new Date(pass.validUntil).toLocaleString("en-KE")}</Text><Button label="Confirm identity and admit" disabled={busy || pass.status !== "READY"} onPress={() => Alert.alert("Record visitor admission?", `${pass.visitorName} visiting ${pass.tenant}. This consumes the pass.`, [{ text: "Cancel", style: "cancel" }, { text: "Admit", onPress: () => { const id = pass.id; setPass(null); void run(async () => { await api.visitorAction({ action: "admit", id }); Alert.alert("Admission recorded", "This pass cannot be used again."); }); } }])} /></View> : null}
  </>;
}
