import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { mobileExpenditureInputSchema, mobileProfileInputSchema } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, styles } from "./ui";
type Run = (action: () => Promise<void>) => Promise<boolean>;
const date = (value: string) => new Date(value).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" });

export function CommunityPanel({ notices, busy, run, refresh }: {
  notices: Awaited<ReturnType<typeof api.getCommunity>>; busy: boolean; run: Run; refresh: () => Promise<void>;
}) {
  return <><Text accessibilityRole="header" style={styles.title}>Community board</Text><Text style={styles.subtitle}>Official communication from your property management team.</Text>
    {!notices.length ? <Text style={styles.subtitle}>No official community notices yet.</Text> : null}
    {notices.map(notice => <View key={notice.id} style={styles.card}>
      <Text style={styles.label}>Official notice · {notice.readAt ? "Read" : "Unread"}</Text>
      <Text style={styles.cardTitle}>{notice.title}</Text><Text style={styles.subtitle}>{notice.organizationName} · {date(notice.publishedAt)}</Text>
      <Text selectable style={styles.subtitle}>{notice.message}</Text>
      {!notice.readAt ? <Button label="Mark as read" secondary disabled={busy} onPress={() => void run(async () => { await api.readCommunity(notice.id); await refresh(); })} /> : null}
    </View>)}<Button label="Refresh notices" secondary disabled={busy} onPress={() => void run(refresh)} />
  </>;
}
export function ExpendituresPanel({ data, busy, run, load }: {
  data: Awaited<ReturnType<typeof api.getExpenditures>> | null; busy: boolean; run: Run; load: (page: number) => Promise<void>;
}) {
  const [description, setDescription] = useState(""); const [amount, setAmount] = useState("");
  const [incurredAt, setIncurredAt] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; });
  const [category, setCategory] = useState<"TENANT_REPAIR" | "TENANT_SERVICE" | "TRANSPORT" | "OTHER">("OTHER");
  const [payee, setPayee] = useState(""); const [reference, setReference] = useState(""); const [notes, setNotes] = useState("");
  const [recorded, setRecorded] = useState(false);
  const input = mobileExpenditureInputSchema.safeParse({ description, amount: Number(amount), incurredAt, category, payee, reference, notes });
  const money = (value: number, currency = data?.currencyCode ?? "KES") => new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(value);
  function submit() {
    if (!input.success) return;
    const values = input.data;
    Alert.alert("Record this expense?", `${money(values.amount)} · ${values.description}`, [
      { text: "Cancel", style: "cancel" }, { text: "Record expense", onPress: () => void run(async () => {
        await api.createExpenditure(values); setDescription(""); setAmount(""); setPayee(""); setReference(""); setNotes(""); setRecorded(true); await load(1);
      }) },
    ]);
  }
  return <><Text accessibilityRole="header" style={styles.title}>Your expenditures</Text><Text style={styles.subtitle}>Record and track your personal expenses.</Text>
    {recorded ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Expense recorded.</Text> : null}
    <View style={styles.card}><Text style={styles.cardTitle}>New expense</Text>
      <Field label="Description" value={description} onChangeText={setDescription} maxLength={1000} editable={!busy} />
      <Field label={`Amount (${data?.currencyCode ?? "KES"})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!busy} />
      <Field label="Date (YYYY-MM-DD)" value={incurredAt} onChangeText={setIncurredAt} maxLength={10} editable={!busy} />
      <Text style={styles.label}>Category</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{([
        ["TENANT_REPAIR", "Repair"], ["TENANT_SERVICE", "Service"], ["TRANSPORT", "Transport"], ["OTHER", "Other"],
      ] as const).map(([value, title]) => <Button key={value} label={title} selected={category === value} secondary={category !== value} disabled={busy} onPress={() => setCategory(value)} />)}</View>
      <Field label="Payee (optional)" value={payee} onChangeText={setPayee} maxLength={200} editable={!busy} />
      <Field label="Reference (optional)" value={reference} onChangeText={setReference} maxLength={200} editable={!busy} />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} maxLength={2000} multiline editable={!busy} />
      <Button label="Record expense" disabled={busy || !input.success} onPress={submit} />
    </View>
    {!data?.items.length ? <Text style={styles.subtitle}>No recorded expenses on this page.</Text> : null}
    {data?.items.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.description}</Text><Text style={styles.label}>{money(item.amount, item.currencyCode)}</Text><Text style={styles.subtitle}>{date(item.incurredAt)} · {item.category.replaceAll("_", " ")} · {item.status}</Text></View>)}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button label="Previous" secondary disabled={busy || !data || data.page <= 1} onPress={() => void run(() => load((data?.page ?? 1) - 1))} /><Button label="Next" secondary disabled={busy || !data?.hasMore} onPress={() => void run(() => load((data?.page ?? 1) + 1))} /></View>
    <Button label="Refresh expenses" secondary disabled={busy} onPress={() => void run(() => load(data?.page ?? 1))} />
  </>;
}

export function ProfilePanel({ profile, busy, run, refresh }: {
  profile: Awaited<ReturnType<typeof api.getProfile>>; busy: boolean; run: Run; refresh: () => Promise<void>;
}) {
  const [values, setValues] = useState(() => ({ phone: profile.phone, email: profile.email, nextOfKinName: profile.nextOfKinName, nextOfKinRelationship: profile.nextOfKinRelationship, nextOfKinPhone: profile.nextOfKinPhone, nextOfKinEmail: profile.nextOfKinEmail }));
  const [saved, setSaved] = useState(false);
  const input = mobileProfileInputSchema.safeParse(values);
  const fields = [
    ["phone", "Phone number"], ["email", "Email (optional)"], ["nextOfKinName", "Next of kin name"],
    ["nextOfKinRelationship", "Relationship"], ["nextOfKinPhone", "Next of kin phone"], ["nextOfKinEmail", "Next of kin email (optional)"],
  ] as const;
  return <><Text accessibilityRole="header" style={styles.title}>My profile</Text><Text style={styles.subtitle}>{profile.fullName}</Text>
    {saved ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Profile updated.</Text> : null}
    <View style={styles.card}>{fields.map(([key, title]) => <Field key={key} label={title} value={values[key]} onChangeText={value => { setSaved(false); setValues(current => ({ ...current, [key]: value })); }} editable={!busy} maxLength={key.toLowerCase().includes("phone") ? 30 : 120} keyboardType={key.toLowerCase().includes("phone") ? "phone-pad" : key.toLowerCase().includes("email") ? "email-address" : "default"} autoCapitalize={key.toLowerCase().includes("email") ? "none" : "words"} />)}
    <Button label="Save profile" disabled={busy || !input.success} onPress={() => { if (input.success) void run(async () => { await api.updateProfile(input.data); setSaved(true); await refresh(); }); }} /></View>
  </>;
}
