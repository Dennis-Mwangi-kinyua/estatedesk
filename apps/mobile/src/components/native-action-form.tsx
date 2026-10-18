import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeActionDefinition, NativeActionField, NativeActionRequest, NativeActionResult } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { Button, Field, FormColumns, styles } from "./ui";

type Row = { key: number; values: Record<string, string> };
type Request = Omit<NativeActionRequest, "values">;
const visible = (field: NativeActionField, values: Record<string, string>) => !field.when || values[field.when.field] === field.when.equals;
const defaults = (fields: NativeActionField[]) => Object.fromEntries(fields.map(field => [field.name, field.defaultValue ?? ""]));

function Choice({ field, value, change, disabled }: { field: NativeActionField; value: string; change: (value: string) => void; disabled: boolean }) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const choices = (field.options ?? []).map((option, index) => ({ ...option, key: `${index}:${option.value}` })).filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={{ gap: 8 }}><Text style={styles.label}>{field.label}{field.required ? " *" : ""}</Text><Pressable accessibilityRole="button" accessibilityLabel={field.label} accessibilityHint="Choose an option" disabled={disabled} onPress={() => { Keyboard.dismiss(); setQuery(""); setOpened(true); }} style={[styles.input, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
    <Text style={[styles.subtitle, { flex: 1 }]}>{field.options?.find(option => option.value === value)?.label ?? "Choose…"}</Text><AppIcon name="chevron-down" size={18} />
  </Pressable><Modal visible={opened} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpened(false)}><SafeAreaView style={{ flex: 1, padding: 20, gap: 16, backgroundColor: "#f3f6f3" }}>
    <Button label="Back to form" icon="arrow-left" secondary onPress={() => setOpened(false)} /><Text accessibilityRole="header" style={styles.cardTitle}>{field.label}</Text>
    <TextInput accessibilityLabel={`Find ${field.label}`} placeholder="Search options…" placeholderTextColor="#62766a" value={query} onChangeText={setQuery} style={styles.input} autoCorrect={false} />
    <FlatList data={choices} keyboardShouldPersistTaps="handled" keyExtractor={option => option.key} ListEmptyComponent={<Text style={styles.subtitle}>No matching options.</Text>} renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: value === item.value }} onPress={() => { change(item.value); setOpened(false); }} style={[styles.card, { marginBottom: 10, flexDirection: "row", alignItems: "center" }]}><Text style={[styles.subtitle, { flex: 1 }]}>{item.label}</Text>{value === item.value ? <AppIcon name="check-circle" /> : null}</Pressable>} />
  </SafeAreaView></Modal></View>;
}

function FormField({ field, value, change, disabled }: { field: NativeActionField; value: string; change: (value: string) => void; disabled: boolean }) {
  if (field.type === "multiselect") {
    const selected: string[] = JSON.parse(value || "[]");
    return <View style={{ gap: 10 }}><Text style={styles.label}>{field.label}</Text>{field.options?.map(option => <Button key={option.value} label={option.label} checked={selected.includes(option.value)} disabled={disabled} secondary onPress={() => change(JSON.stringify(selected.includes(option.value) ? selected.filter(item => item !== option.value) : [...selected, option.value]))} />)}</View>;
  }
  if (field.type === "select") return <Choice field={field} value={value} change={change} disabled={disabled} />;
  if (field.type === "checkbox") return <Button label={field.label} checked={value === "on"} disabled={disabled} secondary onPress={() => change(value === "on" ? "" : "on")} />;
  return <Field label={`${field.label}${field.required ? " *" : ""}${field.type === "date" ? " (YYYY-MM-DD)" : ""}`} value={value} onChangeText={change} editable={!disabled} maxLength={field.maxLength ?? 10000} secureTextEntry={field.type === "password"} multiline={field.type === "multiline"}
    autoCapitalize={["email", "password"].includes(field.type) ? "none" : "sentences"} autoCorrect={!["email", "password"].includes(field.type)} keyboardType={field.type === "decimal" ? "decimal-pad" : field.type === "integer" ? "number-pad" : field.type === "email" ? "email-address" : field.type === "phone" ? "phone-pad" : "default"} />;
}

export function NativeActionForm({ request, close, onError, onBusyChange }: { request: Request; close: (completed: boolean, contextChanged?: boolean) => void; onError: (error: unknown) => void; onBusyChange: (busy: boolean) => void }) {
  const [definition, setDefinition] = useState<NativeActionDefinition | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, Row[]>>({});
  const rowId = useRef(0);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<NativeActionResult | null>(null);
  const [revision, setRevision] = useState(0);
  const [reveal, setReveal] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const { kind, path, actionId, recordId } = request;
  useEffect(() => {
    let active = true;
    void api.getNativeAction({ kind, path, actionId, recordId }).then(form => {
      if (!active) return;
      setDefinition(form); setValues(defaults(form.groups.filter(group => !group.repeat).flatMap(group => group.fields))); setRows(Object.fromEntries(form.groups.filter(group => group.repeat).map(group => [group.id, []])));
    }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      setError(cause instanceof Error ? cause.message : "Unable to load the form.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, path, actionId, recordId, onError, revision]);
  function leave() {
    if (submitting.current) return;
    if (!dirty || result) { close(!!result, !!result?.contextChanged); return; }
    Alert.alert("Discard changes?", "Your unsubmitted form will be cleared.", [{ text: "Keep editing", style: "cancel" }, { text: "Discard", style: "destructive", onPress: () => close(false) }]);
  }
  function update(field: NativeActionField, value: string, groupId?: string, key?: number) {
    setDirty(true); setError("");
    const change = (current: Record<string, string>, fields: NativeActionField[]) => {
      const next = { ...current, [field.name]: value };
      for (const item of fields) if (item.when?.field === field.name) next[item.name] = visible(item, next) ? next[item.name] || item.defaultValue || "" : "";
      return next;
    };
    if (groupId) setRows(current => ({ ...current, [groupId]: current[groupId].map(row => row.key === key ? { ...row, values: change(row.values, definition!.groups.find(group => group.id === groupId)!.fields) } : row) }));
    else setValues(current => change(current, definition!.groups.flatMap(group => group.fields)));
  }
  function groupError(index: number): string | null {
    const group = definition!.groups[index];
    const sets = group.repeat ? (rows[group.id] ?? []).map(row => row.values) : [values];
    for (const set of sets) for (const field of group.fields) if (visible(field, set) && field.required && !set[field.name]?.trim()) return `Enter ${field.label.toLowerCase()}.`;
    return null;
  }
  function go(next: number) { Keyboard.dismiss(); setError(""); setStep(next); scroll.current?.scrollTo({ y: 0, animated: false }); }
  async function submit() {
    if (!definition || submitting.current) return;
    for (let index = 0; index < definition.groups.length; index++) { const message = groupError(index); if (message) { go(index); setError(message); return; } }
    submitting.current = true; setBusy(true); onBusyChange(true); setError("");
    const body: NonNullable<NativeActionRequest["values"]> = {};
    for (const group of definition.groups) for (const field of group.fields) body[field.name] = group.repeat
      ? (rows[group.id] ?? []).map(row => visible(field, row.values) ? row.values[field.name] ?? "" : "")
      : field.type === "multiselect" ? JSON.parse(values[field.name] || "[]") : visible(field, values) ? values[field.name] ?? "" : "";
    try { const response = await api.submitNativeAction({ ...request, values: body }); setResult(response); setValues({}); setRows({}); setDirty(false); }
    catch (cause) { if (cause instanceof api.ApiError && cause.status === 401) onError(cause); setError(cause instanceof Error ? cause.message : "Unable to submit this form."); }
    finally { submitting.current = false; setBusy(false); onBusyChange(false); }
  }
  function fields(items: NativeActionField[], current: Record<string, string>, groupId?: string, key?: number) {
    const shown = items.filter(field => field.type !== "hidden" && visible(field, current));
    const pairs = [];
    for (let index = 0; index < shown.length; index += 2) pairs.push(<FormColumns key={shown[index].name}>{shown.slice(index, index + 2).map(field => <FormField key={field.name} field={field} value={current[field.name] ?? ""} change={value => update(field, value, groupId, key)} disabled={busy} />)}</FormColumns>);
    return pairs;
  }
  const group = definition?.groups[step];
  return <Modal visible animationType="slide" onRequestClose={leave}><SafeAreaView style={{ flex: 1, backgroundColor: "#f3f6f3" }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}><Button label={result ? "Done" : "Back to workspace"} icon="arrow-left" secondary disabled={busy} onPress={leave} /></View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, paddingBottom: 48, gap: 18 }}>
      <IconTile name={definition?.destructive ? "alert-triangle" : "edit-3"} /><Text accessibilityRole="header" style={styles.title}>{definition?.title ?? "Loading form"}</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Loading form" color="#14634e" /> : null}
      {error ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>{!definition ? <Button label="Try again" onPress={() => { setLoading(true); setError(""); setRevision(value => value + 1); }} /> : <Text style={styles.subtitle}>If the connection failed during submission, check the workspace for the result before submitting again.</Text>}</View> : null}
      {result ? <View style={styles.card}><IconTile name="check-circle" /><Text accessibilityRole="alert" style={styles.cardTitle}>{result.message}</Text>{result.credentials ? <><Text style={styles.label}>Created account</Text><Text selectable style={styles.subtitle}>{result.credentials.fullName} · {result.credentials.username}</Text><Button label={reveal ? "Hide password" : "Show password"} icon={reveal ? "eye-off" : "eye"} secondary onPress={() => setReveal(value => !value)} />{reveal ? <Text selectable style={styles.subtitle}>{result.credentials.password}</Text> : null}<Button label="Share account details" icon="share-2" onPress={() => { const account = result.credentials!; void Share.share({ message: `${account.fullName}\nUsername: ${account.username}\nPassword: ${account.password}\n${account.loginUrl}` }).catch(onError); }} /></> : null}{result.plainKey ? <><Text style={styles.label}>New API key · shown once</Text><Button label={reveal ? "Hide API key" : "Reveal API key"} icon={reveal ? "eye-off" : "eye"} secondary onPress={() => setReveal(value => !value)} />{reveal ? <Text selectable style={styles.subtitle}>{result.plainKey}</Text> : null}</> : null}{result.document ? <Button label="Save or share PDF" icon="file-text" secondary onPress={() => void api.shareActionDocument(result.document!).catch(onError)} /> : null}{result.file ? <Button label="Save or share export" icon="download" secondary onPress={() => void api.shareActionFile(result.file!).catch(onError)} /> : null}{result.allocationDraft ? <Button label="Share allocation confirmation" icon="share-2" secondary onPress={() => void Share.share({ title: result.allocationDraft!.subject, message: result.allocationDraft!.message }).catch(onError)} /> : null}<Button label="Return to workspace" onPress={() => close(true, !!result.contextChanged)} /></View> : definition ? <>
        <Text style={styles.subtitle}>{definition.description}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.label}>Step {Math.min(step + 1, definition.groups.length + 1)} of {definition.groups.length + 1} · {group?.title ?? "Review"}</Text>
        {group ? <View style={{ gap: 16 }}><Text accessibilityRole="header" style={styles.cardTitle}>{group.title}</Text>{group.description ? <Text style={styles.subtitle}>{group.description}</Text> : null}
          {group.repeat ? <>{(rows[group.id] ?? []).map((row, index) => <View key={row.key} style={styles.card}><Text style={styles.cardTitle}>{group.title} · {index + 1}</Text>{fields(group.fields, row.values, group.id, row.key)}<Button label="Remove row" icon="trash-2" secondary disabled={busy} onPress={() => { setDirty(true); setRows(current => ({ ...current, [group.id]: current[group.id].filter(item => item.key !== row.key) })); }} /></View>)}<Button label="Add unit mix row" icon="plus" secondary disabled={busy} onPress={() => { const key = ++rowId.current; setDirty(true); setRows(current => ({ ...current, [group.id]: [...current[group.id], { key, values: defaults(group.fields) }] })); }} /></> : <View style={styles.card}>{fields(group.fields, values)}</View>}
        </View> : <>{definition.groups.map((item, index) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text>{(item.repeat ? (rows[item.id] ?? []).map(row => row.values) : [values]).map((set, rowIndex) => <View key={rowIndex} style={{ gap: 10 }}>{item.fields.filter(field => field.type !== "hidden" && visible(field, set)).map(field => <View key={field.name} style={{ gap: 3 }}><Text style={styles.label}>{field.label}</Text><Text style={styles.subtitle}>{field.type === "multiselect" ? (JSON.parse(set[field.name] || "[]") as string[]).map(value => field.options?.find(option => option.value === value)?.label ?? value).join(", ") || "None" : field.type === "password" ? set[field.name] ? "••••••••" : "—" : field.type === "checkbox" ? set[field.name] === "on" ? "Yes" : "No" : (field.options?.find(option => option.value === set[field.name])?.label ?? set[field.name]) || "—"}</Text></View>)}</View>)}<Button label="Edit section" icon="edit-3" secondary disabled={busy} onPress={() => go(index)} /></View>)}</>}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>{step > 0 ? <Button label="Previous" icon="arrow-left" secondary disabled={busy} onPress={() => go(step - 1)} /> : null}{group ? <Button label="Continue" icon="arrow-right" disabled={busy} onPress={() => { const message = groupError(step); if (message) setError(message); else go(step + 1); }} /> : <Button label={busy ? "Submitting…" : definition.submitLabel} icon={definition.destructive ? "trash-2" : "check-circle"} disabled={busy} onPress={() => Alert.alert(definition.title, definition.confirmation, [{ text: "Cancel", style: "cancel" }, { text: definition.submitLabel, style: definition.destructive ? "destructive" : "default", onPress: () => void submit() }])} />}</View>
      </> : null}
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView></Modal>;
}
