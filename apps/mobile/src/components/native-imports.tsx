import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import type { MobileImportKind, MobileImportResult } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, styles } from "./ui";

/** CSV and preview tokens stay in memory and are never saved as form drafts. */
export function NativeImports({ onError, onMutationBusy = () => {}, onCommitted = () => {} }: { onError: (error: unknown) => void; onMutationBusy?: (busy: boolean) => void; onCommitted?: () => void }) {
  const [kind, setKind] = useState<MobileImportKind>("properties");
  const [csv, setCsv] = useState("");
  const [template, setTemplate] = useState("");
  const [result, setResult] = useState<MobileImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setTemplate("");
    void api.getImportTemplate(kind).then(value => { if (active) setTemplate(value.template); }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(cause instanceof Error ? cause.message : "Template unavailable.");
    });
    return () => { active = false; };
  }, [kind, onError]);

  const pickCsv = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); onMutationBusy(true);
    let cachedFile: File | undefined;
    try {
      const selection = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "text/plain", "application/csv"], copyToCacheDirectory: true, multiple: false });
      if (selection.canceled) return;
      const asset = selection.assets[0];
      cachedFile = new File(asset.uri);
      if (!asset.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file. Export Excel spreadsheets as CSV first.");
      if ((asset.size ?? cachedFile.size) > 1000000) throw new Error("Choose a CSV file smaller than 1 MB.");
      const content = (await cachedFile.text()).replace(/^\uFEFF/, "");
      if (content.length > 250000) throw new Error("CSV files must contain at most 250,000 characters.");
      if (content.includes("\0")) throw new Error("Choose a UTF-8 CSV text file.");
      if (mounted.current) { setCsv(content); setResult(null); }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Could not open CSV file.");
    } finally {
      // Do not retain imported customer records in the application cache.
      try { if (cachedFile?.exists) cachedFile.delete(); } catch { /* OS cache cleanup remains available. */ }
      inFlight.current = false; onMutationBusy(false);
      if (mounted.current) setBusy(false);
    }
  };

  const run = async (commit: boolean) => {
    if (inFlight.current || !csv.trim()) return;
    inFlight.current = true; setBusy(true); setError(""); onMutationBusy(true);
    const validationToken = result?.validationToken;
    // A failed/uncertain commit cannot reuse its preview from this screen.
    setResult(null);
    try {
      const next = await api.runImport({ kind, csv, mode: commit ? "commit" : "dry-run", submissionId: Crypto.randomUUID(),
        ...(commit ? { validationToken, confirmImport: "yes" as const } : {}) });
      if (mounted.current) {
        setResult(next);
        if (next.ok && !next.dryRun) { setCsv(""); onCommitted(); }
      }
    } catch (cause) {
      if (!mounted.current) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      else setError(commit ? "The import result is uncertain. Check Import history and the records before trying again." : cause instanceof Error ? cause.message : "Validation failed.");
    } finally {
      inFlight.current = false; onMutationBusy(false);
      if (mounted.current) setBusy(false);
    }
  };
  return <View style={{ gap: 16 }}>
    <Text accessibilityRole="header" style={styles.title}>Import records</Text>
    <Text style={styles.subtitle}>Export your spreadsheet as CSV. Choose the record type, choose a CSV file or paste it with its header, validate, then review and confirm.</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>1. Choose records</Text>
      {(["properties", "units", "tenants"] as const).map(value => <Button key={value} label={value} secondary selected={kind === value} disabled={busy} onPress={() => { setKind(value); setCsv(""); setResult(null); setError(""); }} />)}
      {template ? <><Text style={styles.label}>Example CSV — replace the sample records</Text><Text selectable style={styles.subtitle}>{template}</Text></> : null}
      <Text style={styles.cardTitle}>2. Choose or paste and validate</Text>
      <Button label="Choose CSV file" secondary disabled={busy} onPress={() => { void pickCsv(); }} />
      <Field label="CSV including column headers" value={csv} editable={!busy} multiline autoCorrect={false} autoCapitalize="none" maxLength={250000} onChangeText={value => { setCsv(value); setResult(null); setError(""); }} />
      <Button label="Validate CSV" disabled={busy || !csv.trim()} onPress={() => { void run(false); }} />
    </View>
    {busy ? <ActivityIndicator accessibilityLabel="Processing import" /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {result ? <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{result.dryRun ? "3. Review validation" : "Import result"}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{result.message}</Text>
      <Text style={styles.subtitle}>{result.totalRows} rows · {result.validRows} valid · {result.created} created</Text>
      {result.errors.map((value, index) => <Text key={index} style={styles.error}>{value}</Text>)}
      {result.rowResults.slice(0, 25).map(row => <Text key={row.line} style={styles.subtitle}>Line {row.line}: {row.label} · {row.status}{row.errors.length ? ` · ${row.errors.join("; ")}` : ""}</Text>)}
      {result.rowResults.length > 25 ? <Text style={styles.subtitle}>Showing the first 25 row results. Summary totals cover the complete CSV.</Text> : null}
      {result.rollbackSummary ? <Text style={styles.subtitle}>{result.rollbackSummary}</Text> : null}
      {result.ok && result.dryRun && result.validationToken ? <Button label={`Confirm import of ${result.validRows} ${kind}`} disabled={busy} onPress={() => Alert.alert("Create these records?", `Import ${result.validRows} ${kind} into your selected organization?`, [{ text: "Cancel", style: "cancel" }, { text: "Import records", onPress: () => { void run(true); } }])} /> : null}
    </View> : null}
  </View>;
}
