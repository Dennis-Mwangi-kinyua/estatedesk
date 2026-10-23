import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { NativeWorkspacePage, ReportFilters } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, FormColumns, styles } from "./ui";
import { DashboardSection, dashboardStyles } from "./dashboard-ui";
import { NativeReportCards } from "./native-report-cards";
import { WorkspaceRecordPage } from "./workspace-record-page";
import { FeatureCard } from "./feature-card";

const initial: ReportFilters = { reportPeriod: "month", metric: "organizations", page: 1 };
export function NativePlatformReports({ onError }: { onError: (error: unknown) => void }) {
  const [filters, setFilters] = useState<ReportFilters>(initial);
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [data, setData] = useState<NativeWorkspacePage | null>(null);
  const [busy, setBusy] = useState(true); const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(""); const [exportError, setExportError] = useState("");
  const [revision, setRevision] = useState(0); const [detailId, setDetailId] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now()); const previousQuery = useRef("");
  const onErrorRef = useRef(onError); onErrorRef.current = onError;
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    const key = JSON.stringify(filters); const changed = previousQuery.current !== key; previousQuery.current = key;
    setBusy(true); setError(""); setExportError(""); if (changed) setData(null);
    api.getNativeWorkspace("platform", "/platform/reports", "", filters.page, undefined, filters.organization, filters).then(result => { if (active) { setData(result); setClock(Date.now()); } }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onErrorRef.current(cause);
      else setError(cause instanceof Error ? cause.message : "Unable to load reports.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [filters, revision]);
  const report = data?.report;
  const age = report ? Math.max(0, Math.floor((clock - Date.parse(report.generatedAt)) / 60000)) : 0;
  const stale = !!error || age >= 5;
  const disabled = busy || exporting;
  const refresh = () => setRevision(value => value + 1);
  const select = (id: string) => { setDetailId(id); setFilters(value => ({ ...value, metric: id as ReportFilters["metric"], page: 1 })); };
  const detail = data?.records.find(record => record.id === detailId);
  const exportFile = async (format: "pdf" | "csv") => {
    if (disabled || !report || stale) return;
    setExporting(true); setExportError("");
    try { await api.exportPlatformReport(filters, format); }
    catch (cause) { if (cause instanceof api.ApiError && cause.status === 401) onErrorRef.current(cause); else setExportError(cause instanceof Error ? cause.message : "Unable to export reports."); }
    finally { setExporting(false); }
  };
  const feedback = <>
    {busy ? <View style={styles.card}><ActivityIndicator accessibilityLabel="Loading Reports" /><Text style={styles.subtitle}>Loading your report…</Text></View> : null}
    {error ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{error}</Text>{data ? <Text style={styles.subtitle}>Showing the last successful snapshot. Refresh before exporting.</Text> : null}<Button label="Try again" onPress={refresh} disabled={exporting} /></View> : null}
  </>;
  const organizations = report ? <DashboardSection title="Organizations contributing to this metric" description={filters.metric === "attention" ? "Current backlog; categories may overlap." : "Current and previous counts within the selected dates."}>
    {filters.organization ? <Button label="All organizations" secondary onPress={() => setFilters(value => ({ ...value, organization: undefined, page: 1 }))} disabled={disabled} /> : null}
    {report.organizations.map(org => <FeatureCard key={org.id} title={org.name} badge="🏢" disabled={disabled} description={`Current: ${org.current} · Previous: ${filters.metric === "attention" ? "not a historical snapshot" : org.previous} · Backlog: ${org.attention}${org.amounts.map(amount => ` · ${amount.currency}: ${amount.current} (previous ${amount.previous})`).join("")}`} onPress={() => setFilters(value => ({ ...value, organization: org.id, page: 1 }))} />)}
    {!report.organizations.length ? <Text style={styles.subtitle}>No organizations contributed to this metric in either period.</Text> : null}
    <View style={dashboardStyles.row}><Button label="Previous organizations" secondary disabled={disabled || filters.page <= 1} onPress={() => setFilters(value => ({ ...value, page: value.page - 1 }))} /><Text style={styles.label}>Page {filters.page}</Text><Button label="Next organizations" secondary disabled={disabled || !report.hasMore} onPress={() => setFilters(value => ({ ...value, page: value.page + 1 }))} /></View>
  </DashboardSection> : null;
  return <View style={{ gap: 22 }}>
    {detail ? <WorkspaceRecordPage record={detail} workspace="Reports" emoji="📊" close={() => setDetailId(null)} open={() => {}} act={() => {}} detailContent={<>{feedback}{organizations}</>} /> : null}
    {detailId && !detail ? <Button label="Back to Reports" secondary onPress={() => setDetailId(null)} /> : null}
    <View style={dashboardStyles.hero}><Text style={dashboardStyles.eyebrow}>PLATFORM REPORTS</Text><Text accessibilityRole="header" style={dashboardStyles.heroTitle}>Reports</Text><Text style={dashboardStyles.heroBody}>Explore activity, compare periods, and open organization details.</Text></View>
    <DashboardSection title="Report dates" description="Africa/Nairobi · maximum 366 days · statuses reflect the current state">
      <View style={dashboardStyles.row}>{([['today', 'Today'], ['month', 'This month'], ['lastMonth', 'Last month']] as const).map(([period, label]) => <Button key={period} label={label} secondary selected={!custom && filters.reportPeriod === period} disabled={disabled} onPress={() => { setCustom(false); setFilters(value => ({ ...value, reportPeriod: period, from: undefined, to: undefined, page: 1 })); }} />)}<Button label="Custom dates" secondary disabled={disabled} selected={custom} onPress={() => setCustom(true)} /></View>
      {custom ? <><FormColumns><Field label="From (YYYY-MM-DD)" value={from} onChangeText={setFrom} editable={!disabled} autoCapitalize="none" maxLength={10} /><Field label="To (YYYY-MM-DD)" value={to} onChangeText={setTo} editable={!disabled} autoCapitalize="none" maxLength={10} /></FormColumns><Button label="Apply dates" disabled={disabled} onPress={() => { if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) { setError("Enter both dates as YYYY-MM-DD."); return; } setFilters(value => ({ ...value, reportPeriod: "custom", from, to, page: 1 })); }} /></> : null}
      {report ? <><Text style={styles.subtitle}>{report.from} – {report.to} · {report.scopeName}</Text><Text style={styles.subtitle}>Compared with {report.previousFrom} – {report.previousTo} (equal elapsed duration).</Text></> : null}
    </DashboardSection>
    {feedback}
    {report ? <View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.label}>{stale ? "Snapshot needs refreshing" : "Report up to date"}</Text><Text style={styles.subtitle}>Last updated {new Date(report.generatedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT · {age} min ago</Text></View> : null}
    {data?.notice ? <Text style={dashboardStyles.notice}>{data.notice}</Text> : null}
    {data ? <NativeReportCards records={data.records} open={select} busy={disabled} /> : null}
    {report ? <DashboardSection title="Export filtered report" description="Exports refresh the same dates, organization and selected metric. All matching organizations are included, across pages; maximum 5,000.">
      <View style={dashboardStyles.row}><Button label="Export PDF" disabled={disabled || stale} icon="download" onPress={() => void exportFile("pdf")} /><Button label="Export CSV" disabled={disabled || stale} icon="download" secondary onPress={() => void exportFile("csv")} /></View>
      {exporting ? <Text style={styles.subtitle}>Preparing your export…</Text> : null}
      {exportError ? <Text accessibilityRole="alert" style={styles.error}>{exportError}</Text> : null}
    </DashboardSection> : null}
    <Button label="Refresh reports" icon="refresh-cw" secondary disabled={disabled} onPress={refresh} />
  </View>;
}
