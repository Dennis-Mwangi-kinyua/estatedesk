import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { mobileInspectionFields, mobileInspectionInputSchema } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { draftScope, saveDraft, removeDraft, type Draft } from "../drafts";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import type { Photo } from "../photos";
import { PhotoField } from "./photo-field";
import { Button, Field, styles } from "./ui";
type Run = (action: () => Promise<void>) => Promise<boolean>;
export async function syncDraft(draft: Draft) {
  if (draft.kind === "form") throw new Error("Open this form and review it before submitting.");
  if (draft.kind === "meter") await api.submitReading(draft.body, draft.photos, draft.id);
  else await api.submitInspection(draft.body, draft.photos, draft.id);
  await removeDraft(draft.id, draft.scope);
}
export function DraftsPanel({ drafts, busy, run, refresh }: { drafts: Draft[]; busy: boolean; run: Run; refresh: () => Promise<void> }) {
  return <><Text style={styles.title}>Saved field drafts</Text>
    <Text style={styles.subtitle}>Review and sync when connected. Current assignments and permissions are checked again. Keep drafts until the server confirms receipt. Signing out removes drafts from this device.</Text>
    {!drafts.length ? <Text style={styles.subtitle}>No saved drafts for this workspace.</Text> : null}
    {drafts.map(draft => <View key={draft.id} style={styles.card}><Text style={styles.cardTitle}>{draft.label}</Text><Text style={styles.subtitle}>{new Date(draft.createdAt).toLocaleString("en-KE")}</Text>
      {Object.entries(draft.body).filter(([key]) => !["unitId", "inspectionId"].includes(key)).map(([key, value]) => <Text key={key} style={styles.subtitle}>{mobileInspectionFields.find(f => f.name === key)?.label ?? key}: {String(value)}</Text>)}
      <Text style={styles.subtitle}>{Object.keys(draft.photos).length} evidence photos saved</Text>
      <Button label="Sync this draft" disabled={busy} onPress={() => Alert.alert("Submit saved work?", draft.kind === "meter" ? "The reading will be sent for organization approval." : "The inspection report will complete the scheduled inspection for office handover review.", [{ text: "Cancel", style: "cancel" }, { text: "Sync", onPress: () => void run(async () => { await syncDraft(draft); await refresh(); }) }])} />
      <Button label="Delete draft" secondary disabled={busy} onPress={() => Alert.alert("Delete this draft?", "This removes the unsent report and evidence from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => void run(async () => { await removeDraft(draft.id, draft.scope); await refresh(); }) }])} />
    </View>)}<Button label="Refresh drafts" secondary disabled={busy} onPress={() => void run(refresh)} />
  </>;
}
export function InspectionsPanel({ inspections, session, busy, run, refresh, saved, onError }: { inspections: Awaited<ReturnType<typeof api.getInspections>>; session: MobileSession; busy: boolean; run: Run; refresh: () => Promise<void>; saved: () => void; onError: (error: unknown) => void }) {
  const [selected, setSelected] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState(""); const [recommendations, setRecommendations] = useState("");
  const [photos, setPhotos] = useState<Record<string, Photo>>({});
  return <><Text style={styles.title}>Assigned inspections</Text><Text style={styles.subtitle}>Complete every check. Save a field draft before syncing your handover report.</Text>
    {!inspections.length ? <Text style={styles.subtitle}>No inspections assigned to you.</Text> : null}
    {inspections.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.property} / {item.unit}</Text><Text style={styles.label}>{item.reference} · {item.status}</Text><Text style={styles.subtitle}>{new Date(item.scheduledAt).toLocaleString("en-KE")}</Text>
      {item.summary ? <Text style={styles.subtitle}>Report: {item.summary}</Text> : null}{item.recommendations ? <Text style={styles.subtitle}>Recommendations: {item.recommendations}</Text> : null}
      {item.status === "SCHEDULED" ? <Button label={selected === item.id ? "Hide checklist" : "Open checklist"} secondary disabled={busy} onPress={() => { setSelected(selected === item.id ? "" : item.id); setAnswers({}); setPhotos({}); setSummary(""); setRecommendations(""); }} /> : null}
      {selected === item.id ? <>
        {mobileInspectionFields.map(field => <View key={field.name} style={{ gap: 8 }}><Text style={styles.label}>{field.label}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{["yes", "no"].map(value => <Button key={value} label={value === "yes" ? "Yes" : "No"} selected={answers[field.name] === value} secondary={answers[field.name] !== value} disabled={busy} onPress={() => setAnswers({ ...answers, [field.name]: value })} />)}</View></View>)}
        <Field label="Inspection summary" value={summary} onChangeText={setSummary} multiline maxLength={2000} editable={!busy} />
        <Field label="Damage and recommended repairs" value={recommendations} onChangeText={setRecommendations} multiline maxLength={2000} editable={!busy} />
        <PhotoField label="Condition evidence (optional, under 2MB)" photo={photos.photo_damageObserved ?? null} busy={busy} onError={onError} change={photo => setPhotos(photo ? { photo_damageObserved: photo } : {})} />
        <Button label="Save inspection draft" disabled={busy || !summary.trim() || mobileInspectionFields.some(f => !answers[f.name]) || (answers.damageObserved === "yes" && !recommendations.trim())} onPress={() => void run(async () => {
          const body = mobileInspectionInputSchema.parse({ inspectionId: item.id, ...answers, summary, recommendations });
          await saveDraft({ scope: await draftScope(session), kind: "inspection", label: `Inspection · ${item.property} / ${item.unit}`, body, photos }); setSelected(""); saved();
        })} />
      </> : null}
    </View>)}<Button label="Refresh inspections" disabled={busy} secondary onPress={() => void run(refresh)} />
  </>;
}
