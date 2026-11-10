import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as api from "../api";
import { Button, styles } from "./ui";

export function SecurityActivity({ revision = 0, onError }: { revision?: number; onError: (error: unknown) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getSecurityActivity>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    void api.getSecurityActivity().then(value => { if (active) setData(value); }).catch(cause => {
      if (!active) return;
      setError(cause instanceof api.ApiError && cause.status === 404 ? "Security history is not available in this workspace yet." : "Security history could not load. Try again.");
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, refresh, onError]);
  const date = (value: string) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>Recent security activity</Text><Text style={styles.subtitle}>Your latest 25 recorded sign-ins and security changes.</Text>{data?.passwordChangedAt && <Text style={styles.label}>Password last changed {date(data.passwordChangedAt)} EAT</Text>}{loading && <ActivityIndicator accessibilityLabel="Loading security activity" />}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{data?.events.map(event => <View key={event.id} style={{ gap: 4, borderTopWidth: 1, borderTopColor: "#dce6df", paddingTop: 12 }}><Text style={styles.label}>{event.label}</Text><Text style={styles.subtitle}>{date(event.createdAt)} EAT · {event.device}{event.ip ? ` · ${event.ip}` : ""}</Text></View>)}{!loading && !error && !data?.events.length ? <Text style={styles.subtitle}>No account security events have been recorded yet.</Text> : null}<Button label="Refresh security history" secondary disabled={loading} onPress={() => setRefresh(value => value + 1)} /></View>;
}
