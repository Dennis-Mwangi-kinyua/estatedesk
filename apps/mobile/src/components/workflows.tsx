import { IssueResolution, LeaseSigningPanel, RewardsPanel, SecurityPanel, TenantInspectionsPanel } from "./native-account-services";
import { LegalReader } from "./legal-reader";
import { NativeWorkspace, type WorkspaceTarget } from "./native-workspace";
import { FieldHome } from "./field-home";
import { AppIcon, IconTile, type AppIconName } from "./app-icon";
import { CommunityPanel, ExpendituresPanel, ProfilePanel } from "./tenant-services";
import { ManagementHome } from "./management-home";
import { TenantHome } from "./tenant-home";
import type { TenantTab } from "./tenant-navigation";
import { DocumentsPanel, PaymentReviewPanel, VisitorsPanel, GatePanel } from "./service-panels";
import { InspectionsPanel, DraftsPanel, syncDraft } from "./field-panels";
import { PhotoField } from "./photo-field";
import { draftScope, listDrafts, saveDraft, type Draft } from "../drafts";
import type { Photo } from "../photos";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { enablePush } from "../notifications";
import { ActivityIndicator, Alert, BackHandler, Keyboard, Pressable, Text, View } from "react-native";
import type { MobileSession, MobileBills, MobileIssues, MobileMeters } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, styles } from "./ui";
import { LeasesPanel, MoveOutsPanel, WorkOrdersPanel, PortfolioPanel } from "./workspace-panels";

type Screen = "security" | "rewards" | "tenant-inspections" | "profile" | "community" | "expenditures" | "invoices" | "help" | "water-bills" | "native-workspace" | "platform-home" | "home" | "bills" | "issues" | "meters" | "notifications" | "payment" | "history" | "leases" | "move-outs" | "work-orders" | "portfolio" | "documents" | "payment-review" | "inspections" | "visitors" | "gate" | "drafts";
const screenIcons: Partial<Record<Screen, AppIconName>> = { security: "shield", rewards: "gift", "tenant-inspections": "clipboard", profile: "user", community: "volume-2", expenditures: "bar-chart-2", invoices: "file-text", help: "book-open", "water-bills": "droplet", bills: "credit-card", issues: "tool", meters: "droplet", notifications: "bell", payment: "credit-card", history: "clock", leases: "home", "move-outs": "package", "work-orders": "tool", portfolio: "briefcase", documents: "folder", "payment-review": "check-circle", inspections: "clipboard", visitors: "users", gate: "shield", drafts: "hard-drive" };
type Bill = MobileBills["bills"][number];

export function Workflows({ session, refreshSession, onError, logout, tenantTab, selectTenantTab, onNavigationChange }: {
  tenantTab: TenantTab; selectTenantTab: (tab: TenantTab) => void; onNavigationChange: (screen: string, busy: boolean) => void;
  session: MobileSession; refreshSession: () => Promise<void>; onError: (error: unknown) => void; logout: () => void;
}) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.getProfile>> | null>(null);
  const [community, setCommunity] = useState<Awaited<ReturnType<typeof api.getCommunity>>>([]);
  const [expenditures, setExpenditures] = useState<Awaited<ReturnType<typeof api.getExpenditures>> | null>(null);
  const [workspaceStack, setWorkspaceStack] = useState<WorkspaceTarget[]>([]);
  const workspaceTarget = workspaceStack.at(-1);
  const openTool = (target: WorkspaceTarget) => {
    if (["/dashboard/security", "/dashboard/org/security", "/dashboard/caretaker/security"].includes(target.path)) { void load("security"); return; }
    if (target.kind === "organization" && target.path === "/dashboard/org/notifications") { void load("notifications"); return; }
    if (target.kind === "organization" && target.path === "/dashboard/org/units" && session.features.includes("portfolio")) { void load("portfolio"); return; }
    if (target.path === "/dashboard/gate" && session.features.includes("gate")) { void load("gate"); return; }
    Keyboard.dismiss(); setWorkspaceStack(stack => screen === "native-workspace" ? stack.at(-1)?.path === target.path ? stack : [...stack, target] : [target]); setScreen("native-workspace"); setLoadFailed(false); setNotice(""); };
  const [screen, setScreen] = useState<Screen>("home");
  const managementAccount = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.role ?? "") || ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole);
  const managementVisible = screen === "platform-home" || screen === "home" && session.role !== "TENANT";
  const [busy, setBusy] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [homeRevision, setHomeRevision] = useState(0);
  useEffect(() => { onNavigationChange(screen, busy); }, [screen, busy, onNavigationChange]);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState("");
  const back = useCallback(() => {
    if (busyRef.current) return;
    if (screen === "native-workspace" && workspaceStack.length > 1) {
      setWorkspaceStack(stack => stack.slice(0, -1));
    } else {
      setScreen("home"); setWorkspaceStack([]);
    }
    setLoadFailed(false); setNotice("");
  }, [screen, workspaceStack.length]);
  const [bills, setBills] = useState<MobileBills | null>(null);
  const [issues, setIssues] = useState<MobileIssues | null>(null);
  const [meters, setMeters] = useState<MobileMeters | null>(null);
  const [notifications, setNotifications] = useState<Awaited<ReturnType<typeof api.getNotifications>>>([]);
  const [methods, setMethods] = useState<Awaited<ReturnType<typeof api.getPaymentMethods>>>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.getPaymentHistory>>>([]);
  const [rewards, setRewards] = useState<Awaited<ReturnType<typeof api.getRewards>> | null>(null);
  const [security, setSecurity] = useState<Awaited<ReturnType<typeof api.getSecurity>>>([]);
  const [tenantInspections, setTenantInspections] = useState<Awaited<ReturnType<typeof api.getTenantInspections>> | null>(null);
  const [leaseSigning, setLeaseSigning] = useState<Awaited<ReturnType<typeof api.getLeaseSigning>>>([]);
  const [leases, setLeases] = useState<Awaited<ReturnType<typeof api.getLeases>>>([]);
  const [moveOuts, setMoveOuts] = useState<Awaited<ReturnType<typeof api.getMoveOuts>>>([]);
  const [workOrders, setWorkOrders] = useState<Awaited<ReturnType<typeof api.getWorkOrders>>>([]);
  const [portfolio, setPortfolio] = useState<Awaited<ReturnType<typeof api.getPortfolio>> | null>(null);
  const [documents, setDocuments] = useState<Awaited<ReturnType<typeof api.getDocuments>>>([]);
  const [review, setReview] = useState<Awaited<ReturnType<typeof api.getReviewPayments>> | null>(null);
  const [inspections, setInspections] = useState<Awaited<ReturnType<typeof api.getInspections>>>([]);
  const [visitors, setVisitors] = useState<Awaited<ReturnType<typeof api.getVisitors>>>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [priority, setPriority] = useState("MEDIUM");
  const [bill, setBill] = useState<Bill | null>(null);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [accountName, setAccountName] = useState("");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reading, setReading] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  async function run(action: () => Promise<void>, refreshHome = true) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setNotice("");
    try { await action(); if (refreshHome) setHomeRevision(value => value + 1); return true; } catch (error) { onError(error); return false; } finally { busyRef.current = false; setBusy(false); }
  }
  async function load(target: Screen) {
    Keyboard.dismiss();
    await run(async () => {
      setScreen(target); setLoadingScreen(true); setLoadFailed(false); setLoadError("");
      try {
        if (target === "bills" || target === "water-bills" || target === "invoices") setBills(await api.getBills());
        if (target === "issues") { setIssues(await api.getIssues()); setUnitId(""); }
        if (target === "meters") { setMeters(await api.getMeters()); setUnitId(""); }
        if (target === "notifications") setNotifications(await api.getNotifications());
        if (target === "profile") setProfile(await api.getProfile());
        if (target === "community") setCommunity(await api.getCommunity());
        if (target === "expenditures") setExpenditures(await api.getExpenditures());
        if (target === "history") setHistory(await api.getPaymentHistory());
        if (target === "rewards") setRewards(await api.getRewards());
        if (target === "security") setSecurity(await api.getSecurity());
        if (target === "tenant-inspections") setTenantInspections(await api.getTenantInspections());
        if (target === "leases") {
          setLeaseSigning([]); setLeases(await api.getLeases());
          try { setLeaseSigning(await api.getLeaseSigning()); }
          catch (cause) {
            if (cause instanceof api.ApiError && cause.status === 401) throw cause;
            setNotice("Your leases are loaded. Lease signing is unavailable right now; refresh to try again.");
          }
        }
        if (target === "move-outs") setMoveOuts(await api.getMoveOuts());
        if (target === "work-orders") setWorkOrders(await api.getWorkOrders());
        if (target === "portfolio") setPortfolio(await api.getPortfolio());
        if (target === "documents") setDocuments(await api.getDocuments());
        if (target === "payment-review") setReview(await api.getReviewPayments());
        if (target === "inspections") setInspections(await api.getInspections());
        if (target === "visitors") setVisitors(await api.getVisitors());
        if (target === "drafts") await refreshDrafts();
        setPhoto(null);
      } catch (cause) { setLoadFailed(true); setLoadError(cause instanceof Error ? cause.message : "Unable to load this service."); throw cause; }
      finally { setLoadingScreen(false); }
    }, false);
  }
  async function refreshDrafts() { setDrafts(await listDrafts(await draftScope(session))); }
  async function meterDraft(sync: boolean) {
    const draft = await saveDraft({ scope: await draftScope(session), kind: "meter", label: `Meter · ${meters?.units.find(u => u.id === unitId)?.label ?? unitId} · ${meters?.period}`, body: { unitId, period: meters!.period, currentReading: Number(reading), notes }, photos: photo ? { photo } : {} });
    setUnitId(""); setPhoto(null); setReading(""); setNotes("");
    setNotice("Draft saved on this device. Open saved field drafts to sync when connected.");
    if (sync) { await syncDraft(draft); setNotice("Reading submitted for organization approval."); setMeters(await api.getMeters()); }
  }
  const displayedBills = screen === "water-bills" ? bills?.bills.filter(item => item.source === "WATER_BILL" || (!item.source && /water/i.test(item.label))) : bills?.bills;
  const displayedBalance = screen === "water-bills" ? displayedBills?.reduce((total, item) => total + item.balance, 0) : bills?.totalBalance;
  const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: bills?.currencyCode ?? session.currencyCode }).format(value);
  const chooseUnit = (id: string) => { setUnitId(id); setReading(""); setNotes(""); setPhoto(null); };

  function pay() {
    if (!bill || !method) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > bill.balance) { onError(new Error("Enter an amount within the outstanding balance.")); return; }
    Alert.alert("Confirm payment", `${money(value)} using ${methods.find(item => item.id === method)?.name}. ${method === "mpesa-stk" ? "A prompt will be sent to your phone." : "Your organization must verify your payment before the balance changes."}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: () => void run(async () => {
        await api.submitPayment({ source: bill.source === "PERIOD_BILL" ? "period_bill" : bill.source === "WATER_BILL" ? "water_bill" : "rent_charge", id: bill.source === "PERIOD_BILL" ? bill.period : bill.id, method: method as "mpesa-stk" | "manual-mpesa" | "manual-bank", amount: value, phoneNumber: phone, accountName, transactionId: reference, proofMessage: proof });
        setScreen("bills"); setBill(null); setReference(""); setProof("");
        setNotice(method === "mpesa-stk" ? "Check your phone for the M-Pesa prompt. Refresh bills after confirmation. Check payment history before retrying an uncertain payment." : "Payment submitted for organization verification. Your balance changes after approval.");
      }) },
    ]);
  }

  useEffect(() => {
    const listener = Notifications.addNotificationResponseReceivedListener(() => { void load("notifications"); });
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) { void load("notifications"); void Notifications.clearLastNotificationResponseAsync().catch(onError); }
    }).catch(onError);
    return () => listener.remove();
    // Register once per mounted organization workspace; opening a notification always fetches current authorized data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (busyRef.current) return true;
      if (screen === "home" && session.role === "TENANT" && tenantTab !== "home") { selectTenantTab("home"); return true; }
      if (screen === "home") return false;
      back(); return true;
    });
    return () => listener.remove();
  }, [screen, session.role, tenantTab, selectTenantTab, back]);

  return <>
    {legal ? <LegalReader kind={legal} close={() => setLegal(null)} onError={onError} /> : null}
    {busy ? <ActivityIndicator accessibilityLabel="Loading workspace" color="#14634e" /> : null}
    {notice ? <Text accessibilityRole="alert" style={styles.subtitle}>{notice}</Text> : null}
    {screen !== "home" ? <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={screen === "native-workspace" && workspaceStack.length > 1 ? "Back to previous page" : "Back to home"} disabled={busy} accessibilityState={{ disabled: busy }} onPress={back} style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingRight: 12 }, (pressed || busy) && { opacity: 0.5 }]}><AppIcon name="chevron-left" size={22} /><Text style={styles.label}>Back</Text></Pressable>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}><Text numberOfLines={1} style={[styles.subtitle, { flexShrink: 1 }]}>{session.organizationName ?? "EstateDesk"}</Text><IconTile name={screenIcons[screen] ?? "grid"} size={18} /></View>
    </View> : null}
    {session.role === "TENANT" && !session.requiresAccountSetup ? <View style={{ display: screen === "home" ? "flex" : "none" }}>
      <TenantHome refreshKey={homeRevision} active={screen === "home"} tab={tenantTab} selectTab={selectTenantTab} session={session} busy={busy} openNative={target => void load(target)} openPlatform={() => setScreen("platform-home")} onError={onError} />
    </View> : null}
    {managementAccount && !session.requiresAccountSetup ? <View style={{ display: managementVisible ? "flex" : "none" }}>
      <ManagementHome session={session} busy={busy} active={managementVisible} initialKind={session.role === "TENANT" ? "platform" : undefined} openNative={target => void load(target)} openTool={openTool} onError={onError} />
    </View> : null}
    {session.requiresAccountSetup ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Complete account setup</Text>
      {session.mustChangePassword ? <>
        <Field label="Temporary password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} editable={!busy} />
        <Field label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} editable={!busy} />
        <Field label="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!busy} />
      </> : null}
      <Button label="Read terms" icon="file-text" onPress={() => setLegal("terms")} secondary />
      <Button label="Read privacy notice" icon="shield" onPress={() => setLegal("privacy")} secondary />
      <Button label="I accept the terms of use" checked={acceptedTerms} onPress={() => setAcceptedTerms(!acceptedTerms)} disabled={busy} secondary />
      <Button label="Complete setup" disabled={busy || !acceptedTerms} onPress={() => void run(async () => {
        await api.completeSetup({ currentPassword, newPassword, confirmPassword, acceptedTerms: true });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); await refreshSession();
      })} />
    </View> : loadingScreen ? <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>{screen.replaceAll("-", " ").replace(/^./, value => value.toUpperCase())}</Text><Text style={styles.subtitle}>Loading your latest information…</Text></View> : loadFailed ? <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>{screen.replaceAll("-", " ").replace(/^./, value => value.toUpperCase())}</Text><Text accessibilityRole="alert" style={styles.subtitle}>{loadError || "This service could not load. Try again."}</Text><Button label="Try again" onPress={() => void load(screen)} disabled={busy} /></View> : screen === "home" && session.role === "TENANT" ? null : (screen === "platform-home" || screen === "home" && managementAccount) ? null : screen === "home" ? <>
      <FieldHome session={session} busy={busy} open={target => void load(target)} refresh={() => void run(refreshSession)} />
    </> : screen === "native-workspace" && workspaceTarget ? <>{workspaceStack.map((target, index) => <View key={`${index}:${target.kind}:${target.path}`} style={{ display: index === workspaceStack.length - 1 ? "flex" : "none" }}><NativeWorkspace target={target} onContextChange={refreshSession} open={openTool} onError={onError} onMutationBusy={working => { busyRef.current = working; setBusy(working); }} reviewPayments={session.features.includes("payment-review") ? () => void load("payment-review") : undefined} /></View>)}</> : screen === "documents" ? <DocumentsPanel documents={documents} busy={busy} run={run} refresh={async () => setDocuments(await api.getDocuments())} />
      : screen === "payment-review" ? <PaymentReviewPanel data={review} currency={session.currencyCode} busy={busy} run={run} load={async page => setReview(await api.getReviewPayments(page))} />
      : screen === "visitors" ? <VisitorsPanel visitors={visitors} busy={busy} run={run} refresh={async () => setVisitors(await api.getVisitors())} />
      : screen === "gate" ? <GatePanel busy={busy} run={run} />
      : screen === "drafts" ? <DraftsPanel drafts={drafts} busy={busy} run={run} refresh={refreshDrafts} />
      : screen === "inspections" ? <InspectionsPanel inspections={inspections} session={session} busy={busy} run={run} refresh={async () => setInspections(await api.getInspections())} saved={() => setNotice("Inspection draft saved. Open saved field drafts to review and sync.")} onError={onError} />
      : screen === "rewards" && rewards ? <RewardsPanel data={rewards} busy={busy} run={run} refresh={async () => setRewards(await api.getRewards())} />
      : screen === "security" ? <SecurityPanel sessions={security} busy={busy} run={run} refresh={async () => setSecurity(await api.getSecurity())} tenant={session.role === "TENANT"} />
      : screen === "tenant-inspections" && tenantInspections ? <TenantInspectionsPanel data={tenantInspections} busy={busy} run={run} load={async page => setTenantInspections(await api.getTenantInspections(page))} />
      : screen === "leases" ? <><LeaseSigningPanel requests={leaseSigning} busy={busy} run={run} refresh={async () => { setLeaseSigning(await api.getLeaseSigning()); setLeases(await api.getLeases()); }} /><LeasesPanel leases={leases} currency={session.currencyCode} busy={busy} refresh={() => void load("leases")} /></>
      : screen === "move-outs" ? <MoveOutsPanel notices={moveOuts} busy={busy} refresh={() => void load("move-outs")} run={run} reload={async () => setMoveOuts(await api.getMoveOuts())} />
      : screen === "work-orders" ? <WorkOrdersPanel orders={workOrders} busy={busy} refresh={() => void load("work-orders")} update={(input, evidence) => run(async () => {
        await api.updateWorkOrder(input, evidence); setWorkOrders(await api.getWorkOrders());
        setNotice(input.action === "complete" ? "Completion report submitted for office review." : input.action === "note" ? "Progress note saved." : "Work started.");
      })} onError={onError} />
      : screen === "portfolio" ? <PortfolioPanel data={portfolio} currency={session.currencyCode} busy={busy} search={(query, status, page) => run(async () => { setPortfolio(await api.getPortfolio(query, status, page)); })} />
      : screen === "profile" && profile ? <ProfilePanel profile={profile} busy={busy} run={run} refresh={async () => { setProfile(await api.getProfile()); await refreshSession(); }} />
      : screen === "community" ? <CommunityPanel notices={community} busy={busy} run={run} refresh={async () => setCommunity(await api.getCommunity())} />
      : screen === "expenditures" ? <ExpendituresPanel data={expenditures} busy={busy} run={run} load={async page => setExpenditures(await api.getExpenditures(page))} />
      : screen === "help" ? <NativeWorkspace help target={{ kind: "organization", path: "help", title: "Help & guidance", emoji: "💬", description: "The website’s guides, available to read inside your app." }} open={openTool} onError={onError} /> : screen === "invoices" ? <>
        <Text style={styles.title}>Your invoices</Text>
        {[...new Set(bills?.bills.map(item => item.period).filter(period => /^\d{4}-\d{2}$/.test(period)) ?? [])].sort().reverse().map(period => <View key={period} style={styles.card}>
          <Text style={styles.cardTitle}>{period}</Text>
          <Button label="Share invoice PDF" disabled={busy} onPress={() => void run(() => api.openTenantWebDocument(`${api.websiteUrl()}/dashboard/tenant/invoice/${encodeURIComponent(period)}/download`))} />
        </View>)}
        {!bills?.bills.some(item => /^\d{4}-\d{2}$/.test(item.period)) ? <Text style={styles.subtitle}>No monthly invoices are available.</Text> : null}
        <Button label="Refresh invoices" secondary disabled={busy} onPress={() => void load("invoices")} />
      </>      : screen === "bills" || screen === "water-bills" ? <>
      <Text style={styles.title}>{screen === "water-bills" ? "Water bills" : "Your bills"}</Text>
      <Text style={styles.cardTitle}>Outstanding: {displayedBalance === undefined ? "Unavailable" : money(displayedBalance)}</Text>
      {displayedBills?.length === 0 ? <Text style={styles.subtitle}>No bills to show yet.</Text> : null}
      {displayedBills?.map(item => <View key={item.id} style={styles.card}>
        <Text style={styles.cardTitle}>{item.label} · {item.period}</Text>
        <Text style={styles.subtitle}>Due {new Date(item.dueDate).toLocaleDateString("en-KE")} · {item.status}</Text>
        <Text style={styles.label}>Billed: {money(item.amountDue)} · Balance: {money(item.balance)}</Text>
        {item.balance > 0 && item.source ? <Button label={`Pay ${item.period}`} disabled={busy} onPress={() => void run(async () => {
          setMethods(await api.getPaymentMethods()); setBill(item); setAmount(String(item.balance)); setMethod(""); setReference(""); setProof(""); setScreen("payment");
        })} /> : null}
      </View>)}
      <Button label="Refresh bills" onPress={() => void load(screen === "water-bills" ? "water-bills" : "bills")} disabled={busy} secondary />
    </> : screen === "history" ? <>
      <Text style={styles.title}>Payment history</Text>
      {session.features.includes("leases") ? <Button label="View tenancy history" secondary disabled={busy} onPress={() => void load("leases")} /> : null}
      {history.length === 0 ? <Text style={styles.subtitle}>No payments submitted yet.</Text> : null}
      {history.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{money(item.amount)}</Text><Text style={styles.subtitle}>{item.gatewayStatus} · {item.verificationStatus}</Text><Text style={styles.subtitle}>{item.reference ?? "Awaiting provider reference"} · {new Date(item.createdAt).toLocaleDateString("en-KE")}</Text></View>)}
      <Button label="Refresh payment history" onPress={() => void load("history")} disabled={busy} secondary />
    </> : screen === "payment" ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Pay {bill?.period}</Text>
      <Field label="Payment amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!busy} />
      {methods.length === 0 ? <Text style={styles.subtitle}>No mobile payment methods are enabled. Contact your organization.</Text> : null}
      {methods.map(item => <Button key={item.id} label={`${method === item.id ? "✓ " : ""}${item.name}`} onPress={() => setMethod(item.id)} disabled={busy} secondary={method !== item.id} />)}
      {method ? <>
        <Text style={styles.subtitle}>{methods.find(item => item.id === method)?.instructions}</Text>
        {method !== "manual-bank" ? <Field label="M-Pesa phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!busy} /> : <Field label="Sender or account name" value={accountName} onChangeText={setAccountName} editable={!busy} />}
        {method !== "mpesa-stk" ? <>
          <Field label="Transaction reference" value={reference} onChangeText={setReference} autoCapitalize="characters" editable={!busy} />
          <Field label="Confirmation SMS or bank message (optional)" value={proof} onChangeText={setProof} multiline maxLength={5000} editable={!busy} />
        </> : null}
        <Button label="Review and submit payment" onPress={pay} disabled={busy} />
      </> : null}
    </View> : screen === "issues" ? <>
      <Text style={styles.title}>Maintenance requests</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report a problem</Text>
        {issues?.units.map(unit => <Button key={unit.id} label={`${unitId === unit.id ? "✓ " : ""}${unit.label}`} onPress={() => chooseUnit(unit.id)} disabled={busy} secondary />)}
        {issues?.units.length === 0 ? <Text style={styles.subtitle}>An active lease is required to report a problem.</Text> : null}
        <Text style={styles.label}>Priority</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map(value => <Button key={value} label={value} disabled={busy} selected={priority === value} secondary={priority !== value} onPress={() => setPriority(value)} />)}</View>
        <Field label="Issue title" value={title} onChangeText={setTitle} maxLength={200} editable={!busy} />
        <Field label="Describe the problem" value={description} onChangeText={setDescription} multiline maxLength={5000} editable={!busy} />
        <PhotoField photo={photo} change={setPhoto} busy={busy} onError={onError} />
        <Button label="Submit request" disabled={busy || !unitId || !title.trim() || !description.trim()} onPress={() => void run(async () => {
          await api.submitIssue({ unitId, title, description, priority }, photo); setPhoto(null); setTitle(""); setDescription(""); setIssues(await api.getIssues()); setNotice("Maintenance request submitted.");
        })} />
      </View>
      {issues?.issues.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.status} · {item.priority}</Text><Text style={styles.subtitle}>{item.description}</Text><IssueResolution issue={item} busy={busy} run={run} refresh={async () => setIssues(await api.getIssues())} /></View>)}
      <Button label="Refresh requests" onPress={() => void load("issues")} disabled={busy} secondary />
    </> : screen === "meters" ? <>
      <Text style={styles.title}>Meter readings · {meters?.period}</Text>
      {meters?.units.length === 0 ? <Text style={styles.subtitle}>No assigned occupied units are awaiting readings.</Text> : null}
      {meters?.units.map(unit => <View key={unit.id} style={styles.card}>
        <Button label={`${unitId === unit.id ? "✓ " : ""}${unit.label}`} onPress={() => chooseUnit(unit.id)} disabled={busy} secondary />
        <Text style={styles.subtitle}>Previous reading: {unit.previousReading}</Text>
        {unitId === unit.id ? <>
          <Field label="Current reading" keyboardType="number-pad" value={reading} onChangeText={setReading} editable={!busy} />
          <Field label="Reading notes (optional)" value={notes} onChangeText={setNotes} maxLength={500} editable={!busy} />
          <PhotoField photo={photo} change={setPhoto} busy={busy} onError={onError} />
          <Button label="Save meter draft offline" secondary disabled={busy || !reading.trim() || !Number.isInteger(Number(reading)) || Number(reading) < unit.previousReading} onPress={() => void run(() => meterDraft(false))} />
          <Button label="Submit for approval" disabled={busy || !reading.trim() || !Number.isInteger(Number(reading)) || Number(reading) < unit.previousReading} onPress={() => void run(async () => {
            await meterDraft(true);
          })} />
        </> : null}
      </View>)}
      <Button label="Refresh meters" onPress={() => void load("meters")} disabled={busy} secondary />
    </> : screen === "notifications" ? <>
      <Text style={styles.title}>Notifications</Text>
      <Button label="Enable device notifications" disabled={busy} onPress={() => void run(async () => { await enablePush(); setNotice("Device notifications enabled for this organization. Logout or session revocation removes registration."); })} />
      <Button label="Disable device notifications" disabled={busy} onPress={() => void run(async () => { await api.disablePush(); setNotice("Device notifications disabled."); })} secondary />
      {notifications.length === 0 ? <Text style={styles.subtitle}>No notifications yet.</Text> : null}
      {notifications.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.message}</Text>{!item.readAt ? <Button label="Mark as read" disabled={busy} onPress={() => void run(async () => { await api.readNotification(item.id); setNotifications(await api.getNotifications()); })} secondary /> : <Text style={styles.subtitle}>Read</Text>}</View>)}
      <Button label="Refresh notifications" onPress={() => void load("notifications")} disabled={busy} secondary />
    </> : null}
    {session.requiresAccountSetup || screen === "home" && (session.role !== "TENANT" || tenantTab === "account") ? <Button label="Sign out" onPress={logout} disabled={busy} secondary /> : null}
  </>;
}
