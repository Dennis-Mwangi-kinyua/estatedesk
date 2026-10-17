import { useState } from "react";
import { Alert, Text, View } from "react-native";
import type * as api from "../api";
import type { MobileWorkOrderInput } from "@estatedesk/contracts/mobile";
import { Button, Field, styles } from "./ui";

type Result<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
const date = (value: string) => new Date(value).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", year: "numeric", month: "short", day: "numeric" });
const money = (value: number, currency: string) => new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(value);

export function LeasesPanel({ leases, currency, busy, refresh }: { leases: Result<typeof api.getLeases>; currency: string; busy: boolean; refresh: () => void }) {
  return <>
    <Text style={styles.title}>Your leases</Text>
    <Text style={styles.subtitle}>Your current tenancy and previous leases. Deposits below are contractual amounts, not confirmation of money held.</Text>
    {leases.length === 0 ? <Text style={styles.subtitle}>No leases are linked to this account.</Text> : null}
    {leases.map(lease => <View key={lease.id} style={styles.card}>
      <Text style={styles.cardTitle}>{lease.propertyName} · Unit {lease.unitLabel}</Text>
      <Text style={styles.label}>{label(lease.status)}{lease.buildingName ? ` · ${lease.buildingName}` : ""}</Text>
      <Text style={styles.subtitle}>Starts {date(lease.startDate)}{lease.endDate ? ` · Ends ${date(lease.endDate)}` : " · No fixed end date"}</Text>
      <Text style={styles.label}>Monthly rent: {money(lease.monthlyRent, currency)}</Text>
      <Text style={styles.subtitle}>Rent due on day {lease.dueDay} of each month</Text>
      {lease.deposit !== null ? <Text style={styles.subtitle}>Contractual deposit: {money(lease.deposit, currency)}</Text> : null}
    </View>)}
    <Button label="Refresh leases" onPress={refresh} disabled={busy} secondary />
  </>;
}

export function MoveOutsPanel({ notices, busy, refresh }: { notices: Result<typeof api.getMoveOuts>; busy: boolean; refresh: () => void }) {
  return <>
    <Text style={styles.title}>Move-out progress</Text>
    <Text style={styles.subtitle}>Track your submitted notices and inspections. Your tenancy stays active until management completes handover.</Text>
    {notices.length === 0 ? <Text style={styles.subtitle}>You have no move-out notices.</Text> : null}
    {notices.map(notice => <View key={notice.id} style={styles.card}>
      <Text style={styles.cardTitle}>{notice.propertyName} · Unit {notice.unitLabel}</Text>
      <Text style={styles.label}>{label(notice.status)}</Text>
      <Text style={styles.subtitle}>Notice submitted: {date(notice.noticeDate)}</Text>
      <Text style={styles.subtitle}>Planned move-out: {date(notice.moveOutDate)}</Text>
      <Text style={styles.subtitle}>Inspection: {notice.inspectionStatus ? label(notice.inspectionStatus) : "Not scheduled"}</Text>
      {notice.inspectionAt ? <Text style={styles.subtitle}>{new Date(notice.inspectionAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} EAT</Text> : null}
    </View>)}
    <Button label="Refresh move-out progress" onPress={refresh} disabled={busy} secondary />
  </>;
}

export function WorkOrdersPanel({ orders, busy, refresh, update }: {
  orders: Result<typeof api.getWorkOrders>; busy: boolean; refresh: () => void;
  update: (input: MobileWorkOrderInput) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState("");
  const [materials, setMaterials] = useState("");
  const [instructions, setInstructions] = useState("");
  const [filter, setFilter] = useState<"active" | "all">("active");
  const visible = orders.filter(item => filter === "all" || !["RESOLVED", "CLOSED", "CANCELLED"].includes(item.status));
  function complete(issueId: string) {
    Alert.alert("Submit completion report?", "The office will review your report before the tenant confirms the work. This does not close the issue immediately.", [
      { text: "Cancel", style: "cancel" },
      { text: "Submit report", onPress: () => { void update({ action: "complete", issueId, workSummary: summary, materialsUsed: materials, tenantInstructions: instructions }).then(success => { if (success) { setSelected(null); setSummary(""); setMaterials(""); setInstructions(""); } }); } },
    ]);
  }
  return <>
    <Text style={styles.title}>Maintenance work orders</Text>
    <Text style={styles.subtitle}>Work assigned to you or within your assigned units. Lists show up to 100 recent work orders.</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Button label="Active work" disabled={busy} selected={filter === "active"} secondary={filter !== "active"} onPress={() => setFilter("active")} />
      <Button label="All recent work" disabled={busy} selected={filter === "all"} secondary={filter !== "all"} onPress={() => setFilter("all")} />
    </View>
    {visible.length === 0 ? <Text style={styles.subtitle}>No work orders in this view.</Text> : null}
    {visible.map(order => <View key={order.id} style={styles.card}>
      <Text style={styles.cardTitle}>{order.title}</Text>
      <Text style={styles.label}>{label(order.priority)} · {label(order.status)}</Text>
      {order.propertyName ? <Text style={styles.subtitle}>{order.propertyName}{order.unitLabel ? ` / ${order.unitLabel}` : ""}</Text> : null}
      <Text style={styles.subtitle}>{order.description}</Text>
      <Text style={styles.subtitle}>Reported {date(order.createdAt)}</Text>
      {order.progressNotes ? <Text style={styles.subtitle}>Progress: {order.progressNotes}</Text> : null}
      {order.reportStatus ? <Text style={styles.label}>Completion report: {label(order.reportStatus)}</Text> : null}
      {order.canStart ? <Button label="Start work" disabled={busy} onPress={() => { void update({ action: "start", issueId: order.id }); }} /> : null}
      {order.canUpdate && !order.pendingReport ? <Button label={selected === order.id ? "Hide work report" : "Update progress or submit report"} disabled={busy} secondary onPress={() => {
        setSelected(selected === order.id ? null : order.id); setNote(""); setSummary(""); setMaterials(""); setInstructions("");
      }} /> : null}
      {selected === order.id && order.canUpdate && !order.pendingReport ? <>
        <Field label="Progress note" value={note} onChangeText={setNote} multiline maxLength={2000} editable={!busy} />
        <Button label="Save progress note" disabled={busy || note.trim().length < 4} secondary onPress={() => { void update({ action: "note", issueId: order.id, progressNote: note }).then(success => { if (success) setNote(""); }); }} />
        <Field label="Work completed (at least 10 characters)" value={summary} onChangeText={setSummary} multiline maxLength={5000} editable={!busy} />
        <Field label="Materials used (optional)" value={materials} onChangeText={setMaterials} multiline maxLength={2000} editable={!busy} />
        <Field label="Instructions for the tenant (optional)" value={instructions} onChangeText={setInstructions} multiline maxLength={2000} editable={!busy} />
        <Button label="Submit completion report" disabled={busy || summary.trim().length < 10} onPress={() => complete(order.id)} />
      </> : null}
      {order.pendingReport ? <Text style={styles.subtitle}>Awaiting review. Refresh to see the latest status.</Text> : null}
    </View>)}
    <Button label="Refresh work orders" onPress={refresh} disabled={busy} secondary />
  </>;
}

export function PortfolioPanel({ data, currency, busy, search }: {
  data: Result<typeof api.getPortfolio> | null; currency: string; busy: boolean;
  search: (q: string, status: string, page: number) => Promise<boolean>;
}) {
  const [q, setQ] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  async function filter(nextStatus = status) {
    if (await search(q, nextStatus, 1)) { setStatus(nextStatus); setAppliedQuery(q); }
  }
  return <>
    <Text style={styles.title}>Property units</Text>
    <Text style={styles.subtitle}>Search units and check occupancy across your assigned portfolio.</Text>
    <Field label="Search property, building or unit" value={q} onChangeText={setQ} maxLength={100} editable={!busy} returnKeyType="search" onSubmitEditing={() => { if (!busy) void filter(); }} />
    <Button label="Search units" disabled={busy} onPress={() => { void filter(); }} />
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {["ALL", "VACANT", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"].map(value => <Button key={value} label={label(value)} disabled={busy} selected={status === value} secondary={status !== value} onPress={() => { void filter(value); }} />)}
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.label}>{data?.total ?? 0} units found · Page {data?.page ?? 1} of {data?.totalPages ?? 1}</Text>
    {data?.units.length === 0 ? <Text style={styles.subtitle}>No units match these filters.</Text> : null}
    {data?.units.map(unit => <View key={unit.id} style={styles.card}>
      <Text style={styles.cardTitle}>Unit {unit.houseNo}</Text>
      <Text style={styles.subtitle}>{unit.propertyName}{unit.buildingName ? ` / ${unit.buildingName}` : ""}</Text>
      <Text style={styles.label}>{label(unit.status)} · {label(unit.type)}{!unit.isActive ? " · Inactive" : ""}</Text>
      <Text style={styles.cardTitle}>{money(unit.rentAmount, currency)} / month</Text>
    </View>)}
    <Button label="Previous page" disabled={busy || !data || data.page <= 1} secondary onPress={() => { void search(appliedQuery, status, (data?.page ?? 1) - 1); }} />
    <Button label="Next page" disabled={busy || !data || data.page >= data.totalPages} secondary onPress={() => { void search(appliedQuery, status, (data?.page ?? 1) + 1); }} />
    <Button label="Refresh units" disabled={busy} secondary onPress={() => { void search(appliedQuery, status, data?.page ?? 1); }} />
  </>;
}
