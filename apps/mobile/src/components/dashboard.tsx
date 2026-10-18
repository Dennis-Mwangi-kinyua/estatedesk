import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, styles } from "./ui";
export function Dashboard({ session }: { session: MobileSession }) {
  const [tiles, setTiles] = useState<{ label: string; value: string }[]>([]); const [error, setError] = useState(""); const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const tasks: Promise<{ label: string; value: string }>[] = [];
    if (session.role === "TENANT" && session.canViewBills) tasks.push(api.getBills().then(data => ({ label: "Outstanding balance", value: new Intl.NumberFormat("en-KE", { style: "currency", currency: data.currencyCode }).format(data.totalBalance) })));
    if (session.features.includes("caretaker-issues")) tasks.push(api.getWorkOrders().then(data => ({ label: "Active work · latest 100", value: String(data.filter(item => !["CLOSED", "RESOLVED", "CANCELLED"].includes(item.status)).length) })));
    if (session.features.includes("inspections")) tasks.push(api.getInspections().then(data => ({ label: "Scheduled inspections · latest 100", value: String(data.filter(item => item.status === "SCHEDULED").length) })));
    if (session.features.includes("portfolio")) tasks.push(api.getPortfolio("", "VACANT").then(data => ({ label: "Vacant units in your portfolio", value: String(data.total) })));
    if (session.features.includes("payment-review")) tasks.push(api.getReviewPayments().then(data => ({ label: "Payments awaiting review", value: `${data.payments.length}${data.hasMore ? "+" : ""}` })));
    void Promise.allSettled(tasks).then(results => { if (!active) return; setTiles(results.flatMap(result => result.status === "fulfilled" ? [result.value] : [])); setError(results.some(result => result.status === "rejected") ? "Some summaries could not load. Refresh when connected." : ""); });
    return () => { active = false; };
  }, [session, version]);
  return <>{tiles.map(tile => <View key={tile.label} style={styles.card}><Text style={styles.subtitle}>{tile.label}</Text><Text style={styles.title}>{tile.value}</Text></View>)}{error ? <Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text> : null}<Button label="Refresh dashboard" secondary onPress={() => setVersion(value => value + 1)} /></>;
}
