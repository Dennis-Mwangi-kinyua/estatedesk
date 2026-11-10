import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { TodayItem, TodaySummary } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, styles } from "./ui";

type Destination = NonNullable<TodayItem["native"]>;
export function TodayPanel({ open, onError }: { open: (target: Destination) => void; onError: (error: unknown) => void }) {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [view, setView] = useState("all");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    void api.getToday().then(value => { if (active) setData(value); }).catch(cause => {
      if (!active) return;
      setError(cause instanceof api.ApiError && cause.status === 404 ? "Today is not available in this workspace yet." : "Could not refresh Today. Check your connection and try again.");
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, onError]);
  const date = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
  const sections = data?.sections.map(section => ({ ...section, items: section.items.filter(item => view === "overdue" ? item.urgency === "overdue" : view === "tasks" ? section.id === "tasks" || section.id === "work" : view === "messages" ? section.id === "messages" : true) })) ?? [];
  async function markRead(item: TodayItem) {
    if (reading) return;
    setReading(item.id); setNotice("");
    try {
      await api.readNotification(item.id.slice("message:".length));
      setData(current => current ? { ...current, sections: current.sections.map(section => ({ ...section, items: section.items.filter(row => row.id !== item.id) })) } : current);
      setNotice("Message marked as read.");
    } catch (cause) { setNotice("Could not mark the message as read. Try again."); onError(cause); }
    finally { setReading(null); }
  }
  return <View style={{ gap: 16 }}>
    <View style={styles.card}><Text accessibilityRole="header" style={styles.title}>Today</Text><Text style={styles.subtitle}>{data ? `${data.name}, here is what needs your attention.` : "Your work, messages and next actions in one place."}</Text>{data && <Text style={styles.subtitle}>Updated {date(data.generatedAt)} (East Africa Time)</Text>}<Button label={loading ? "Refreshing Today…" : "Refresh Today"} disabled={loading || !!reading} secondary onPress={() => setRevision(value => value + 1)} />{loading && <ActivityIndicator accessibilityLabel="Refreshing Today" />}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}{data ? " Showing previously loaded information." : ""}</Text> : null}</View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{[["all", "Everything"], ["overdue", "Overdue"], ["tasks", "My tasks"], ["messages", "Messages"]].map(([key, label]) => <Button key={key} label={label} selected={view === key} secondary onPress={() => setView(key)} />)}</View>
    <Text style={styles.subtitle}>Opening an item does not complete it. Save, send or approve changes in its workspace.</Text>
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.subtitle}>{notice}</Text> : null}
    {!loading && !error && !sections.some(section => section.items.length) ? <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>Nothing waiting in this view</Text><Text style={styles.subtitle}>You can continue in your workspace.</Text></View> : null}
    {sections.filter(section => section.items.length).map(section => <View key={section.id} style={{ gap: 12 }}><Text accessibilityRole="header" style={styles.cardTitle}>{section.title}</Text>{section.hasMore && <Text style={styles.subtitle}>More items are available in the workspace.</Text>}{section.items.map(item => <View key={item.id} style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.detail}</Text>{item.dueAt && <Text style={styles.label}>{item.urgency === "overdue" ? "Overdue" : item.urgency === "today" ? "Due today" : "Due"}: {date(item.dueAt)}</Text>}{item.native ? <Button label={item.action} disabled={!!reading} onPress={() => open(item.native!)} /> : null}{section.id === "messages" && <Button label={reading === item.id ? "Marking as read…" : "Mark as read"} disabled={!!reading} secondary onPress={() => void markRead(item)} />}</View>)}</View>)}
  </View>;
}
