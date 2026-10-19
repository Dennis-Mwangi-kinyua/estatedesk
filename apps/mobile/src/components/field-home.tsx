import { FeatureCard } from "./feature-card";
import { Text, View } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { IconTile } from "./app-icon";
import { Dashboard } from "./dashboard";
import { DashboardSection } from "./dashboard-ui";
import { useCardGrid, cardGridStyles as g } from "./card-grid";
import { Button, styles } from "./ui";

type Destination = "meters" | "leases" | "move-outs" | "work-orders" | "portfolio" | "documents" | "payment-review" | "inspections" | "visitors" | "gate" | "drafts" | "notifications" | "security" | "help" | "bills";
type Tool = { title: string; description: string; emoji: string; target: Destination; feature?: MobileSession["features"][number]; caretaker?: boolean };
const tools: Tool[] = [
  { title: "Meter readings", description: "Capture readings and evidence for approval.", emoji: "💧", target: "meters", caretaker: true },
  { title: "Maintenance", description: "Follow assignments and submit completion reports.", emoji: "🛠️", target: "work-orders", feature: "caretaker-issues" },
  { title: "Inspections", description: "Complete assigned checks and handover reports.", emoji: "📋", target: "inspections", feature: "inspections" },
  { title: "Saved field drafts", description: "Review and sync work saved on this device.", emoji: "💾", target: "drafts", caretaker: true },
  { title: "Units & occupancy", description: "Search the property units in your portfolio.", emoji: "🏡", target: "portfolio", feature: "portfolio" },
  { title: "Payment review", description: "Review evidence and verify pending payments.", emoji: "💳", target: "payment-review", feature: "payment-review" },
  { title: "Visitor passes", description: "Create and manage authorized visitor passes.", emoji: "👋", target: "visitors", feature: "visitors" },
  { title: "Gate access", description: "Scan passes, verify identity and confirm entry.", emoji: "🛡️", target: "gate", feature: "gate" },
  { title: "Leases", description: "Review available tenancy details and agreements.", emoji: "📝", target: "leases", feature: "leases" },
  { title: "Move-out progress", description: "Follow notices, inspections and handovers.", emoji: "📦", target: "move-outs", feature: "move-outs" },
  { title: "Documents", description: "Preview and share available receipts and leases.", emoji: "📁", target: "documents", feature: "documents" },
  { title: "Notifications", description: "Read updates and manage device notifications.", emoji: "🔔", target: "notifications" },
  { title: "Account security", description: "Review and revoke signed-in device sessions.", emoji: "🔐", target: "security" },
  { title: "Help", description: "Find guidance for your mobile workspace.", emoji: "💬", target: "help" },
];

export function FieldHome({ session, busy, open, refresh }: { session: MobileSession; busy: boolean; open: (target: Destination) => void; refresh: () => void }) {
  const grid = useCardGrid();
  const visible = tools.filter(tool => (!tool.feature || session.features.includes(tool.feature)) && (!tool.caretaker || session.role === "CARETAKER"));
  return <View onLayout={grid.onLayout} style={{ gap: 24 }}>
    <View style={styles.card}><IconTile name={session.role === "SECURITY" ? "shield" : session.role === "CARETAKER" ? "tool" : "home"} size={28} /><Text accessibilityRole="header" style={styles.title}>Hello, {session.fullName.split(" ")[0]}</Text><Text style={styles.subtitle}>{session.organizationName ?? "EstateDesk"} · {session.role?.replaceAll("_", " ")}</Text></View>
    <Dashboard session={session} busy={busy} open={open} />
    <DashboardSection title="Your workspace" description="Choose a tool to get started."><View style={g.grid}>{visible.map(tool => <FeatureCard key={tool.target} title={tool.title} description={tool.description} badge={tool.emoji} disabled={busy} style={grid.cell} onPress={() => open(tool.target)} />)}</View></DashboardSection>
    <Button label="Refresh workspace" icon="refresh-cw" secondary disabled={busy} onPress={refresh} />
  </View>;
}
