import { useState } from "react";
import { Alert, Text, View } from "react-native";
import * as api from "../api";
import { Button, Field, styles } from "./ui";
import { SignatureField, type SignatureValue } from "./signature-field";
import { InspectionPhoto } from "./inspection-photo";

type Run = (action: () => Promise<void>) => Promise<boolean>;
const date = (value: string) => new Date(value).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
export function IssueResolution({ issue, busy, run, refresh }: { issue: Awaited<ReturnType<typeof api.getIssues>>["issues"][number]; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  const [feedback, setFeedback] = useState("");
  const report = issue.resolution;
  if (!report) return null;
  return <><Text style={styles.cardTitle}>Work ready for your review</Text><Text style={styles.subtitle}>{report.workSummary}</Text>
    {report.materialsUsed ? <Text style={styles.subtitle}>Materials: {report.materialsUsed}</Text> : null}
    {report.tenantInstructions ? <Text style={styles.subtitle}>{report.tenantInstructions}</Text> : null}
    <Field label="Your feedback (optional)" value={feedback} onChangeText={setFeedback} multiline maxLength={2000} editable={!busy} />
    <Button label="Confirm repairs completed" disabled={busy} onPress={() => Alert.alert("Confirm and close this request?", "Confirm only after checking that the reported work is complete.", [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: () => void run(async () => { await api.confirmIssue(issue.id, report.id, feedback); setFeedback(""); await refresh(); }) }])} />
  </>;
}

export function LeaseSigningPanel({ requests, busy, run, refresh }: { requests: Awaited<ReturnType<typeof api.getLeaseSigning>>; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  return <>{requests.map(item => <LeaseSignature key={`${item.id}:${item.sourceDocumentHash}`} item={item} busy={busy} run={run} refresh={refresh} />)}</>;
}
function LeaseSignature({ item, busy, run, refresh }: { item: Awaited<ReturnType<typeof api.getLeaseSigning>>[number]; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  const [signature, setSignature] = useState<SignatureValue>({ signatureMethod: "TYPED" });
  const [name, setName] = useState(item.name); const [consent, setConsent] = useState(false); const [reviewed, setReviewed] = useState(false); const [reason, setReason] = useState("");
  return <View style={styles.card}><Text style={styles.cardTitle}>Review and sign · {item.unitLabel}</Text>
    <Text style={styles.subtitle}>Expires {date(item.expiresAt)}</Text><Text selectable style={styles.subtitle}>Document SHA-256: {item.sourceDocumentHash}</Text>
    <Button label="Open lease contract" secondary disabled={busy} onPress={() => void run(async () => { await api.openLeaseSigningDocument(item.id); setReviewed(true); })} />
    <Text style={styles.subtitle}>Review the contract before signing. Your authenticated account, signature, time, IP address, device and document hash form the evidence record.</Text>
    <Field label="Full legal name as electronic signature" value={name} onChangeText={setName} maxLength={200} editable={!busy} />
    <SignatureField value={signature} change={setSignature} disabled={busy} />
    <Button label={item.consentText} checked={consent} secondary disabled={busy} onPress={() => setConsent(value => !value)} />
    {!item.canSign ? <Text style={styles.subtitle}>An earlier signer must sign before you can continue.</Text> : null}
    <Button label="Sign lease" disabled={busy || !reviewed || !consent || name.trim().length < 2 || !item.canSign || signature.signatureMethod !== "TYPED" && !signature.signatureData} onPress={() => Alert.alert("Sign this lease?", `Your electronic signature will be recorded as ${name.trim()}.`, [{ text: "Cancel", style: "cancel" }, { text: "Sign lease", onPress: () => void run(async () => { await api.submitLeaseSignature({ action: "sign", signerId: item.id, signatureText: name, consent: true, sourceDocumentHash: item.sourceDocumentHash, ...signature }); await refresh(); }) }])} />
    <Field label="Reason for declining (optional)" value={reason} onChangeText={setReason} multiline maxLength={1000} editable={!busy} />
    <Button label="Decline to sign" secondary disabled={busy || reason.trim().length < 5} onPress={() => Alert.alert("Decline this lease?", "Management will receive your reason.", [{ text: "Cancel", style: "cancel" }, { text: "Decline", style: "destructive", onPress: () => void run(async () => { await api.submitLeaseSignature({ action: "decline", signerId: item.id, reason, sourceDocumentHash: item.sourceDocumentHash }); await refresh(); }) }])} />
  </View>;
}

export function RewardsPanel({ data, busy, run, refresh }: { data: Awaited<ReturnType<typeof api.getRewards>>; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  return <><Text accessibilityRole="header" style={styles.title}>RentRewards</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>{data.availablePoints} available points · {data.tier}</Text>
      <Text style={styles.subtitle}>{data.points} earned · {data.redeemedPoints} redeemed · {data.streakMonths} month streak</Text>
      <Text style={styles.subtitle}>{data.earlyPayments} early · {data.onTimePayments} on-time payments</Text>
      {data.nextTier ? <Text style={styles.subtitle}>{data.pointsToNextTier} points to {data.nextTier}</Text> : null}
    </View>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text> : null}
    <Text style={styles.cardTitle}>Redeem</Text><Text style={styles.subtitle}>Your property office fulfills approved voucher requests.</Text>
    {data.catalog.map(reward => <View key={reward.id} style={styles.card}><Text style={styles.cardTitle}>{reward.label}</Text><Text style={styles.subtitle}>{reward.description}</Text><Text style={styles.label}>{reward.pointsCost} points · {reward.category}</Text>
      <Button label={`Request ${reward.label}`} disabled={busy || data.availablePoints < reward.pointsCost} onPress={() => Alert.alert("Request this reward?", `${reward.pointsCost} points · ${reward.label}`, [{ text: "Cancel", style: "cancel" }, { text: "Request", onPress: () => void run(async () => { await api.requestReward(reward.id); setMessage("Reward requested. Your property office will fulfill the voucher."); await refresh(); }) }])} />
    </View>)}
    <Text style={styles.cardTitle}>Recent requests</Text>
    {!data.redemptions.length ? <Text style={styles.subtitle}>No reward requests yet.</Text> : null}
    {data.redemptions.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.label}</Text><Text style={styles.subtitle}>{item.pointsCost} points · {item.status} · {date(item.createdAt)}</Text>{item.fulfilledAt ? <Text style={styles.subtitle}>Fulfilled {date(item.fulfilledAt)}</Text> : null}</View>)}
    <Button label="Refresh rewards" secondary disabled={busy} onPress={() => void run(refresh)} />
  </>;
}

export function SecurityPanel({ sessions, busy, run, refresh, tenant }: { sessions: Awaited<ReturnType<typeof api.getSecurity>>; busy: boolean; run: Run; refresh: () => Promise<void>; tenant: boolean }) {
  const [currentPassword, setCurrent] = useState(""); const [newPassword, setNew] = useState(""); const [confirmPassword, setConfirm] = useState(""); const [message, setMessage] = useState("");
  function revoke(sessionId?: string) {
    Alert.alert("Sign out other devices?", sessionId ? "This device session will end. Your current session stays signed in." : "All other signed-in sessions will end.", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => void run(async () => { await api.updateSecurity(sessionId ? { action: "revoke", sessionId } : { action: "revoke-others" }); await refresh(); }) }]);
  }
  return <><Text accessibilityRole="header" style={styles.title}>Security</Text>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text> : null}
    {tenant ? <View style={styles.card}><Text style={styles.cardTitle}>Change password</Text>
      <Field label="Current password" secureTextEntry autoCapitalize="none" value={currentPassword} onChangeText={setCurrent} editable={!busy} />
      <Field label="New password" secureTextEntry autoCapitalize="none" value={newPassword} onChangeText={setNew} editable={!busy} />
      <Field label="Confirm new password" secureTextEntry autoCapitalize="none" value={confirmPassword} onChangeText={setConfirm} editable={!busy} />
      <Button label="Update password" disabled={busy || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword || newPassword === currentPassword} onPress={() => void run(async () => {
        await api.updateSecurity({ action: "password", currentPassword, newPassword, confirmPassword }); setCurrent(""); setNew(""); setConfirm(""); setMessage("Password updated."); await refresh();
      })} />
    </View> : null}
    <Text style={styles.cardTitle}>Signed-in devices</Text>
    {sessions.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.isCurrent ? "This device" : "Other device"}</Text><Text selectable style={styles.subtitle}>{item.userAgent ?? "Unknown device"}</Text><Text style={styles.subtitle}>{item.ipAddress ?? "IP unavailable"} · Last active {date(item.lastSeenAt)}</Text><Text style={styles.subtitle}>Expires {date(item.expiresAt)}</Text>
      {!item.isCurrent ? <Button label="Sign out this device" secondary disabled={busy} onPress={() => revoke(item.id)} /> : null}
    </View>)}
    <Button label="Sign out all other devices" secondary disabled={busy || !sessions.some(item => !item.isCurrent)} onPress={() => revoke()} />
    <Button label="Refresh devices" secondary disabled={busy} onPress={() => void run(refresh)} />
  </>;
}

export function TenantInspectionsPanel({ data, busy, run, load }: { data: Awaited<ReturnType<typeof api.getTenantInspections>>; busy: boolean; run: Run; load: (page: number) => Promise<void> }) {
  return <><Text accessibilityRole="header" style={styles.title}>Your inspections</Text>
    {!data.items.length ? <Text style={styles.subtitle}>No inspections on this page.</Text> : null}
    {data.items.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.unitLabel}</Text><Text style={styles.label}>{item.status}</Text><Text style={styles.subtitle}>Scheduled {date(item.scheduledAt)} · {item.inspectorName}</Text>{item.completedAt ? <Text style={styles.subtitle}>Completed {date(item.completedAt)}</Text> : null}
      {item.notes ? <Text selectable style={styles.subtitle}>{item.notes}</Text> : null}
      {item.checklist ? Object.entries(item.checklist).filter(([key]) => !["roomPhotos", "checkIn"].includes(key)).map(([key, value]) => <Text key={key} style={styles.subtitle}>{key.replaceAll("_", " ")}: {typeof value === "boolean" ? value ? "Passed" : "Needs attention" : typeof value === "string" ? value : JSON.stringify(value)}</Text>) : null}
      {item.photos.map((photo, index) => <InspectionPhoto key={`${photo.id}:${index}`} inspectionId={item.id} photo={photo} busy={busy} run={run} />)}
      {item.status === "COMPLETED" ? <Button label="Share inspection report" secondary disabled={busy} onPress={() => void run(() => api.shareTenantDocument(`${api.backendOrigin()}${item.reportPath}`))} /> : null}
    </View>)}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button label="Previous" secondary disabled={busy || data.page <= 1} onPress={() => void run(() => load(data.page - 1))} /><Button label="Next" secondary disabled={busy || !data.hasMore} onPress={() => void run(() => load(data.page + 1))} /></View>
    <Button label="Refresh inspections" secondary disabled={busy} onPress={() => void run(() => load(data.page))} />
  </>;
}
