import { nativeTenantDestination } from "../native-tenant-navigation";
import { useCardGrid, cardGridStyles } from "./card-grid";
import { AppIcon } from "./app-icon";
import { useEffect, useState, useMemo, type ComponentProps } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { DashboardAction, DashboardSection, dashboardStyles as base } from "./dashboard-ui";
import type { TenantTab } from "./tenant-navigation";
import { useDashboardResume } from "./use-dashboard-resume";

function Action(props: ComponentProps<typeof DashboardAction>) {
  return <DashboardAction {...props} centered />;
}
function Section({ title, description, emoji, children }: ComponentProps<typeof DashboardSection>) {
  return <View style={base.section}><View style={m.centerHeading}>
    <View style={m.sectionTitleRow}>{emoji ? <AppIcon badge={emoji} size={20} /> : null}
    <Text accessibilityRole="header" style={[base.sectionTitle, m.sectionTitle]}>{title}</Text></View>
    {description ? <Text style={[base.body, m.centerText]}>{description}</Text> : null}
  </View>{children}</View>;
}

export type TenantHomeScreen = "profile" | "community" | "expenditures" | "invoices" | "help" | "water-bills" | "bills" | "history" | "issues" | "leases" | "documents" | "move-outs" | "visitors" | "notifications";
type Summary = {
  bills: Awaited<ReturnType<typeof api.getBills>> | null;
  leases: Awaited<ReturnType<typeof api.getLeases>> | null;
  issues: Awaited<ReturnType<typeof api.getIssues>> | null;
  notifications: Awaited<ReturnType<typeof api.getNotifications>> | null;
  payments: Awaited<ReturnType<typeof api.getPaymentHistory>> | null;
};
type Feature = { title: string; description: string; emoji: string; path: string; screen?: TenantHomeScreen; feature?: MobileSession["features"][number] };
const groups: { title: string; description: string; cards: Feature[] }[] = [
  { title: "Payments & records", description: "Keep your bills, spending and documents together.", cards: [
    { title: "Bills & payments", description: "Review balances and make a payment.", emoji: "💳", path: "/dashboard/tenant/payments", screen: "bills" },
    { title: "Invoices", description: "View monthly invoices and download PDFs.", emoji: "🧾", path: "/dashboard/tenant/invoice" },
    { title: "Water bills", description: "Check water charges and billing history.", emoji: "💧", path: "/dashboard/tenant/water-bills", screen: "water-bills" },
    { title: "Expenditures", description: "Record and track your personal expenses.", emoji: "📊", path: "/dashboard/tenant/expenditures" },
    { title: "RentRewards", description: "Explore your points and request rewards.", emoji: "🎁", path: "/dashboard/tenant/rewards" },
    { title: "Documents", description: "Open and share receipts and lease PDFs.", emoji: "📁", path: "/dashboard/tenant/documents", screen: "documents", feature: "documents" },
  ] },
  { title: "Your home & community", description: "Manage your tenancy and stay connected.", cards: [
    { title: "My lease", description: "Review your agreement and tenancy details.", emoji: "🏡", path: "/dashboard/tenant/lease" },
    { title: "Maintenance", description: "Report a problem and follow repair progress.", emoji: "🛠️", path: "/dashboard/tenant/issues", screen: "issues" },
    { title: "Inspections", description: "View scheduled inspections and reports.", emoji: "📋", path: "/dashboard/tenant/inspections" },
    { title: "Notices & move-out", description: "Read notices and manage your move-out.", emoji: "📬", path: "/dashboard/tenant/notices" },
    { title: "Community board", description: "Read official updates from your property.", emoji: "📣", path: "/dashboard/tenant/community" },
    { title: "Visitors", description: "Create, share and manage visitor passes.", emoji: "👋", path: "/dashboard/tenant/visitors", screen: "visitors", feature: "visitors" },
  ] },
  { title: "Your account", description: "Your details, security and support.", cards: [
    { title: "My account", description: "Your account and workspace details.", emoji: "👤", path: "/dashboard/tenant/profile" },
    { title: "Security", description: "Manage your password and signed-in devices.", emoji: "🔐", path: "/dashboard/security" },
    { title: "My history", description: "Find past tenancies, payments and records.", emoji: "🕘", path: "/dashboard/tenant/history" },
    { title: "Help & guidance", description: "Find answers for everyday tenancy tasks.", emoji: "💬", path: "/dashboard/tenant/help" },
  ] },
];

const date = (value: string) => new Date(value).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi", day: "numeric", month: "short", year: "numeric" });
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, character => character.toUpperCase());

export function TenantHome({ session, busy, openNative, openWeb: openWebFallback, openPlatform, onError, tab, selectTab, active = true, refreshKey = 0 }: {
  refreshKey?: number; active?: boolean; tab: TenantTab; selectTab: (tab: TenantTab) => void;
  session: MobileSession; busy: boolean; openNative: (screen: TenantHomeScreen) => void;
  openWeb: (path?: string) => void; openPlatform: () => void; onError: (error: unknown) => void;
}) {
  const openWeb = (path?: string) => {
    const destination = path ? nativeTenantDestination(path, session) : null;
    if (destination) { openNative(destination); return; }
    openWebFallback(path);
  };
  const cardGrid = useCardGrid();
  const [summary, setSummary] = useState<Summary>({ bills: null, leases: null, issues: null, notifications: null, payments: null });
  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState(false);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups.map(group => ({ ...group, cards: group.cards.filter(card =>
      (!["bills", "water-bills"].includes(card.screen ?? "") || session.canViewBills) &&
      (!card.feature || session.features.includes(card.feature)) &&
      (!needle || `${group.title} ${card.title} ${card.description}`.toLowerCase().includes(needle)),
    ) })).filter(group => group.cards.length > 0);
  }, [query, session.features, session.canViewBills]);
  function refresh() { if (!loading && !busy) { setLoading(true); setPartial(false); setVersion(value => value + 1); } }
  useDashboardResume(refresh, active);
  useEffect(() => {
    let active = true;
    async function load<K extends keyof Summary>(key: K, task: Promise<Summary[K]>) {
      try {
        const value = await task;
        if (active) setSummary(current => ({ ...current, [key]: value }));
      } catch (error) {
        if (!active) return;
        if (error instanceof api.ApiError && error.status === 401) { onError(error); return; }
        setPartial(true);
        setSummary(current => ({ ...current, [key]: null }));
      }
    }
    void Promise.all([
      load("bills", session.canViewBills ? api.getBills() : Promise.resolve(null)),
      load("leases", session.features.includes("leases") ? api.getLeases() : Promise.resolve(null)),
      load("issues", api.getIssues()), load("notifications", api.getNotifications()),
      load("payments", api.getPaymentHistory()),
    ]).then(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session, version, onError, refreshKey]);
  const formatter = useMemo(() => new Intl.NumberFormat("en-KE", { style: "currency", currency: session.currencyCode, maximumFractionDigits: 2 }), [session.currencyCode]);
  const money = (value: number) => formatter.format(value);
  const lease = summary.leases?.find(item => item.status === "ACTIVE");
  const openIssues = summary.issues?.issues.filter(item => !["CLOSED", "RESOLVED", "CANCELLED"].includes(item.status)).length;
  const unread = summary.notifications?.filter(item => !item.readAt).length;
  const gridStyle = cardGrid.cell;
  const metrics = [
    { title: "Monthly rent", emoji: "🏡", value: lease ? money(lease.monthlyRent) : "—", detail: lease ? `Due on day ${lease.dueDay}` : "See your lease details", onPress: () => openWeb("/dashboard/tenant/lease") },
    ...(session.canViewBills ? [{ title: "Outstanding balance", emoji: "💳", value: summary.bills ? money(summary.bills.totalBalance) : "—", detail: summary.bills ? "View your bills and payments" : "Balance currently unavailable", onPress: () => openNative("bills") }] : []),
    { title: "Open requests", emoji: "🛠️", value: openIssues === undefined ? "—" : String(openIssues), detail: "From your latest 100 requests", onPress: () => openNative("issues") },
    { title: "Notifications", emoji: "🔔", value: unread === undefined ? "—" : String(unread), detail: "Unread in your latest 100 updates", onPress: () => openNative("notifications") },
  ];

  return <View style={s.root} onLayout={cardGrid.onLayout}>
    {tab === "home" ? <>
    <View style={[s.hero, m.hero]}>
      <View style={m.heroHeading}>
        <Text style={m.eyebrow}>YOUR TENANT WORKSPACE</Text>
        <Text accessibilityRole="header" style={m.greeting}>Welcome back, {session.fullName.split(" ")[0]}</Text>
        <Text style={s.body}>Your rent, lease, and service requests in one place.</Text>
        <View style={m.organizationPill}><AppIcon name="home" size={15} /><Text style={m.organizationName}>{session.organizationName ?? "EstateDesk"}</Text></View>
      </View>
      <View style={m.heroActions}>
        {session.canViewBills ? <Action dark emoji="💳" title={summary.bills && summary.bills.totalBalance > 0 ? "Pay outstanding balance" : "View payments"} onPress={() => openNative("bills")} disabled={busy} /> : null}
        <Action emoji="📝" title="My lease" onPress={() => openWeb("/dashboard/tenant/lease")} disabled={busy} />
        <Action emoji="🛠️" title="Maintenance requests" onPress={() => openNative("issues")} disabled={busy} />
      </View>
    </View>

    <Section title="Your account at a glance">
      {loading ? <ActivityIndicator accessibilityLabel="Loading your account summary" color="#14634e" /> : null}
      <View style={[cardGridStyles.grid, { justifyContent: "center" }]}>{metrics.map(metric => <Pressable key={metric.title} accessibilityRole="button" accessibilityLabel={`${metric.title}: ${metric.value}. ${metric.detail}`} disabled={busy} onPress={metric.onPress}
        style={({ pressed }) => [s.metric, cardGridStyles.card, m.centerCard, gridStyle, m.compactCard, pressed && cardGridStyles.pressed, busy && cardGridStyles.disabled]}>
        <View style={s.metricHeading}><AppIcon badge={metric.emoji} size={24} /><Text style={[s.metricLabel, s.flex]}>{metric.title}</Text></View><Text style={s.metricValue}>{metric.value}</Text><Text style={s.caption}>{metric.detail}</Text>
      </Pressable>)}</View>
      {partial ? <Text accessibilityRole="alert" style={s.notice}>Some summaries are unavailable. You can still open your features below or refresh to try again.</Text> : null}
    </Section>

    <Section title="Your shortcuts" description="Bills, documents, and updates in one place.">
      <View style={[cardGridStyles.grid, { justifyContent: "center" }]}>{[
        ...(session.canViewBills ? [{ title: "Water bills", emoji: "💧", description: "Usage and charges", screen: "water-bills" as const, path: "" }] : []),
        { title: "Invoices", emoji: "🧾", description: "Monthly invoices", screen: null, path: "/dashboard/tenant/invoice" },
        { title: "Notifications", emoji: "🔔", description: "Property updates", screen: "notifications" as const, path: "" },
        { title: "Documents", emoji: "📁", description: "Receipts and leases", screen: "documents" as const, path: "/dashboard/tenant/documents" },
        { title: "Account", emoji: "👤", description: "Your account details", screen: null, path: "/dashboard/tenant/profile" },
        { title: "All services", emoji: "🗂️", description: "Explore your workspace", screen: null, path: "" },
      ].map(action => <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={action.title} accessibilityHint={action.description} accessibilityState={{ disabled: busy }} disabled={busy}
        onPress={() => action.screen === null ? action.path ? openWeb(action.path) : selectTab("services") : action.screen === "documents" && !session.features.includes("documents") ? openWeb("/dashboard/tenant/documents") : openNative(action.screen)}
        style={({ pressed }) => [m.shortcut, cardGridStyles.card, m.centerCard, gridStyle, m.compactCard, pressed && cardGridStyles.pressed, busy && cardGridStyles.disabled]}>
        <View style={m.shortcutIcon}><AppIcon badge={action.emoji} size={24} /></View><Text style={s.cardTitle}>{action.title}</Text><Text style={s.caption}>{action.description}</Text>
      </Pressable>)}</View>
    </Section>

    <Section emoji="🏡" title="Your tenancy">
      <View style={s.panel}>
        <View style={s.row}><View style={s.homeMark}><AppIcon name="home" size={28} /></View><View style={s.flex}>
          <Text style={s.cardTitle}>{lease?.propertyName ?? (loading ? "Loading your tenancy…" : "Your tenancy records")}</Text>
          <Text style={s.body}>{lease ? [lease.buildingName, `Unit ${lease.unitLabel}`].filter(Boolean).join(" · ") : "View your lease and previous tenancies."}</Text>
        </View></View>
        {lease ? <>
          <View style={s.divider} /><View style={s.row}><View style={s.flex}><Text style={s.caption}>LEASE STATUS</Text><Text style={s.status}>Active lease</Text></View><View style={s.flex}><Text style={s.caption}>START DATE</Text><Text style={s.detail}>{date(lease.startDate)}</Text></View></View>
        </> : null}
        <Action emoji="📝" title="View lease details" onPress={() => openWeb("/dashboard/tenant/lease")} disabled={busy} />
      </View>
    </Section>

    </> : null}

    {tab !== "home" ? <View style={m.pageHeading}>
      <Text accessibilityRole="header" style={m.pageTitle}>{tab === "services" ? "Your services" : tab === "account" ? "Your account" : "Your activity"}</Text>
      <Text style={s.body}>{tab === "services" ? "Everything for your home and account." : tab === "account" ? "Your details and everyday account tools." : "Recent payments and messages from your property team."}</Text>
    </View> : null}

    {tab === "account" ? <>
      <View style={s.panel}>
        <View style={{ alignItems: "center", gap: 10 }}><View style={s.homeMark}><AppIcon name="user" size={28} /></View>
          <Text style={s.cardTitle}>{session.fullName}</Text><Text style={s.body}>{session.organizationName ?? "EstateDesk"}</Text>
          <Text style={s.caption}>{session.role?.replaceAll("_", " ")}</Text>
        </View>
      </View>
      <Action emoji="👤" title="Edit profile & next of kin" disabled={busy} onPress={() => openNative("profile")} />
      {session.features.includes("leases") ? <Action emoji="🏡" title="My leases" disabled={busy} onPress={() => openNative("leases")} /> : null}
      {session.features.includes("documents") ? <Action emoji="📁" title="My documents" disabled={busy} onPress={() => openNative("documents")} /> : null}
      <Action emoji="🔔" title="Notifications & device alerts" disabled={busy} onPress={() => openNative("notifications")} />
      <Action emoji="🕘" title="Payment history" disabled={busy} onPress={() => openNative("history")} />
      <Action emoji="💬" title="Help & guidance" disabled={busy} onPress={() => openNative("help")} />
    </> : null}

    {tab === "activity" || tab === "home" ? <>
    <Section emoji="💳" title="Recent payments" description="Your latest payment submissions and their status.">
      <View style={s.panel}>
        {loading && summary.payments === null ? <Text style={s.body}>Loading recent payments…</Text> : summary.payments === null ? <Text style={s.body}>Payment activity is unavailable. Open your history to try again.</Text> : summary.payments.length === 0 ? <Text style={s.body}>No payments yet. Your recent activity will appear here.</Text> : summary.payments.slice(0, 3).map(payment => <View key={payment.id} style={s.activity}>
          <View style={s.row}><Text style={[s.cardTitle, s.flex]}>{money(payment.amount)}</Text><Text style={s.caption}>{date(payment.createdAt)}</Text></View>
          <Text style={s.body}>{label(payment.verificationStatus)} · {label(payment.gatewayStatus)}</Text>
          {payment.reference ? <Text style={s.caption}>Ref: {payment.reference}</Text> : null}
        </View>)}
        <Action emoji="🧾" title="View payment history" onPress={() => openNative("history")} disabled={busy} />
      </View>
    </Section>

    <Section emoji="🔔" title="Latest updates" description="Recent messages from your property team.">
      <View style={s.panel}>
        {loading && summary.notifications === null ? <Text style={s.body}>Loading updates…</Text> : summary.notifications === null ? <Text style={s.body}>Updates are unavailable. Open notifications to try again.</Text> : summary.notifications.length === 0 ? <Text style={s.body}>You’re up to date. New notifications will appear here.</Text> : summary.notifications.slice(0, 2).map(item => <View key={item.id} style={s.activity}>
          <Text style={s.caption}>{date(item.createdAt)}{!item.readAt ? " · UNREAD" : ""}</Text><Text style={s.cardTitle}>{item.title}</Text><Text numberOfLines={3} style={s.body}>{item.message}</Text>
        </View>)}
        <Action emoji="📬" title="See all notifications" onPress={() => openNative("notifications")} disabled={busy} />
      </View>
    </Section>

    </> : null}

    {tab === "services" ? <>
    <View style={{ gap: 12 }}>
      <TextInput accessibilityLabel="Search tenant features" placeholder="Search bills, lease, help…" placeholderTextColor="#6b7d72" value={query} onChangeText={setQuery} autoCorrect={false} maxLength={100} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={[s.searchInput, m.searchInput]} />
      {query ? <Action title="Clear search" onPress={() => { setQuery(""); Keyboard.dismiss(); }} /> : null}
      {query ? <Text accessibilityLiveRegion="polite" style={s.caption}>{visibleGroups.reduce((total, group) => total + group.cards.length, 0)} matching features</Text> : null}
    </View>
    {visibleGroups.map(group => <Section key={group.title} title={group.title} description={group.description}>
      <View style={[cardGridStyles.grid, { justifyContent: "center" }]}>{group.cards.map(card => <Pressable key={card.path} accessibilityRole="button" accessibilityLabel={card.title} accessibilityHint={card.description} accessibilityState={{ disabled: busy }} disabled={busy}
        onPress={() => card.screen && (!card.feature || session.features.includes(card.feature)) && (card.screen !== "bills" || session.canViewBills) ? openNative(card.screen) : openWeb(card.path)}
        style={({ pressed }) => [s.featureCard, m.serviceCard, cardGridStyles.card, m.centerCard, gridStyle, pressed && cardGridStyles.pressed, busy && cardGridStyles.disabled]}>
        <View style={s.row}><View accessible={false} importantForAccessibility="no-hide-descendants" style={[s.iconBadge, { backgroundColor: group.title === "Payments & records" ? "#eaf4ee" : group.title === "Your home & community" ? "#edf1fb" : "#f4eef9" }]}><AppIcon badge={card.emoji} size={24} /></View></View>
        <Text style={s.cardTitle}>{card.title}</Text><Text style={s.body}>{card.description}</Text>
        <View accessible={false} style={[cardGridStyles.footer, { justifyContent: "center", width: "100%" }]}><Text style={cardGridStyles.footerText}>Open service</Text><AppIcon name="arrow-right" size={16} /></View>
      </Pressable>)}</View>
    </Section>)}
    {query && visibleGroups.length === 0 ? <Text style={s.body}>No features match your search. Try another name.</Text> : null}

    <Action emoji="✨" title="Open full workspace" onPress={() => openWeb()} disabled={busy} />
    </> : null}

    <View style={s.footer}>
      {["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) ? <Action emoji="🌐" title="Platform dashboard" onPress={openPlatform} disabled={busy} /> : null}
      <Action title={loading ? "Refreshing overview…" : "Refresh overview"} emoji="🔄" onPress={refresh} disabled={busy || loading} />
    </View>
  </View>;
}


const m = StyleSheet.create({
  centerText: { textAlign: "center" },
  centerHeading: { alignItems: "center", gap: 8 },
  centerCard: { alignItems: "center" },
  compactCard: { minHeight: 148, padding: 16, gap: 8 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sectionTitle: { fontSize: 18, lineHeight: 25, textAlign: "center", flexShrink: 1 },
  heroHeading: { alignItems: "center", gap: 12 },
  eyebrow: { color: "#62766a", fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textAlign: "center" },
  organizationPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: "#dde8e1", borderRadius: 20, backgroundColor: "#ffffff" },
  organizationName: { color: "#466153", fontSize: 12, textAlign: "center", flexShrink: 1 },
  heroActions: { gap: 8, borderTopWidth: 1, borderTopColor: "#e1e9e4", paddingTop: 18 },
  shortcutIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#edf4f1", alignItems: "center", justifyContent: "center" },
  hero: { padding: 22, gap: 20, backgroundColor: "#f7faf8", borderWidth: 1, borderColor: "#dce6df" },
  greeting: { textAlign: "center", color: "#173e32", fontSize: 26, lineHeight: 34, fontWeight: "700", marginTop: 5 },
  balance: { textAlign: "center", color: "#ffffff", fontSize: 32, lineHeight: 41, fontWeight: "700", letterSpacing: -0.6 },
  bell: { minWidth: 48, minHeight: 48, borderRadius: 16, backgroundColor: "#285447", alignItems: "center", justifyContent: "center" },
  bellEmoji: { fontSize: 23, lineHeight: 31 }, unreadDot: { position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#f5c96c" },
  shortcut: { padding: 16, minHeight: 124, gap: 8, borderRadius: 18, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dee7e1" },
  shortcutEmoji: { fontSize: 26, lineHeight: 34 }, pageHeading: { gap: 8 }, pageTitle: { textAlign: "center", color: "#173e32", fontSize: 27, lineHeight: 35, fontWeight: "700" },
  serviceCard: { minHeight: 148, padding: 16, gap: 10 }, searchInput: { textAlign: "center", fontSize: 16, minHeight: 54 },
});

// Tenant presentation stays centered without changing management dashboards.
const s = {
  ...base,
  ...StyleSheet.create({
    root: { gap: 24 },
    flex: { minWidth: 0, width: "100%" },
    row: { flexDirection: "column", alignItems: "center", gap: 12 },
    metricHeading: { alignItems: "center", gap: 8, width: "100%" },
    organizationText: { ...base.organizationText, flex: 0, textAlign: "center" },
    heroBody: { ...base.heroBody, textAlign: "center" },
    cardTitle: { ...base.cardTitle, textAlign: "center" },
    caption: { ...base.caption, textAlign: "center" },
    body: { ...base.body, textAlign: "center" },
    metricLabel: { ...base.metricLabel, textAlign: "center" },
    metricValue: { ...base.metricValue, textAlign: "center" },
    notice: { ...base.notice, textAlign: "center" },
    status: { ...base.status, textAlign: "center" },
    detail: { ...base.detail, textAlign: "center" },
  }),
};
