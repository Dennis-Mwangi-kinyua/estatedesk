import { CommunityPanel, ExpendituresPanel, ProfilePanel } from "./tenant-services";
import { ManagementHome } from "./management-home";
import { Dashboard } from "./dashboard";
import { TenantHome } from "./tenant-home";
import type { TenantTab } from "./tenant-navigation";
import { DocumentsPanel, PaymentReviewPanel, VisitorsPanel, GatePanel } from "./service-panels";
import { InspectionsPanel, DraftsPanel, syncDraft } from "./field-panels";
import { PhotoField } from "./photo-field";
import { draftScope, listDrafts, saveDraft, type Draft } from "../drafts";
import type { Photo } from "../photos";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { enablePush } from "../notifications";
import { ActivityIndicator, Alert, BackHandler, Keyboard, Linking, Text, View } from "react-native";
import type { MobileSession, MobileBills, MobileIssues, MobileMeters, MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { Button, Field, styles } from "./ui";
import { LeasesPanel, MoveOutsPanel, WorkOrdersPanel, PortfolioPanel } from "./workspace-panels";

type Screen = "profile" | "community" | "expenditures" | "invoices" | "help" | "water-bills" | "platform-home" | "home" | "bills" | "issues" | "meters" | "notifications" | "payment" | "history" | "leases" | "move-outs" | "work-orders" | "portfolio" | "documents" | "payment-review" | "inspections" | "visitors" | "gate" | "drafts";
type Bill = MobileBills["bills"][number];

export function Workflows({ session, refreshSession, onError, logout, openTenantWorkspace, openWorkspace, tenantTab, selectTenantTab, onNavigationChange }: {
  tenantTab: TenantTab; selectTenantTab: (tab: TenantTab) => void; onNavigationChange: (screen: string, busy: boolean) => void;
  session: MobileSession; refreshSession: () => Promise<void>; onError: (error: unknown) => void; logout: () => void; openTenantWorkspace: (path?: string) => void; openWorkspace: (kind: MobileWorkspaceKind, path: string) => void;
}) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.getProfile>> | null>(null);
  const [community, setCommunity] = useState<Awaited<ReturnType<typeof api.getCommunity>>>([]);
  const [expenditures, setExpenditures] = useState<Awaited<ReturnType<typeof api.getExpenditures>> | null>(null);
  const [screen, setScreen] = useState<Screen>("home");
  const [busy, setBusy] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [homeRevision, setHomeRevision] = useState(0);
  useEffect(() => { onNavigationChange(screen, busy); }, [screen, busy, onNavigationChange]);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [bills, setBills] = useState<MobileBills | null>(null);
  const [issues, setIssues] = useState<MobileIssues | null>(null);
  const [meters, setMeters] = useState<MobileMeters | null>(null);
  const [notifications, setNotifications] = useState<Awaited<ReturnType<typeof api.getNotifications>>>([]);
  const [methods, setMethods] = useState<Awaited<ReturnType<typeof api.getPaymentMethods>>>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.getPaymentHistory>>>([]);
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
  async function run(action: () => Promise<void>, refreshHome = true) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(true); setNotice("");
    try { await action(); if (refreshHome) setHomeRevision(value => value + 1); return true; } catch (error) { onError(error); return false; } finally { busyRef.current = false; setBusy(false); }
  }
  async function load(target: Screen) {
    Keyboard.dismiss();
    await run(async () => {
      setScreen(target); setLoadingScreen(true); setLoadFailed(false);
      try {
        if (target === "bills" || target === "water-bills" || target === "invoices") setBills(await api.getBills());
        if (target === "issues") { setIssues(await api.getIssues()); setUnitId(""); }
        if (target === "meters") { setMeters(await api.getMeters()); setUnitId(""); }
        if (target === "notifications") setNotifications(await api.getNotifications());
        if (target === "profile") setProfile(await api.getProfile());
        if (target === "community") setCommunity(await api.getCommunity());
        if (target === "expenditures") setExpenditures(await api.getExpenditures());
        if (target === "history") setHistory(await api.getPaymentHistory());
        if (target === "leases") setLeases(await api.getLeases());
        if (target === "move-outs") setMoveOuts(await api.getMoveOuts());
        if (target === "work-orders") setWorkOrders(await api.getWorkOrders());
        if (target === "portfolio") setPortfolio(await api.getPortfolio());
        if (target === "documents") setDocuments(await api.getDocuments());
        if (target === "payment-review") setReview(await api.getReviewPayments());
        if (target === "inspections") setInspections(await api.getInspections());
        if (target === "visitors") setVisitors(await api.getVisitors());
        if (target === "drafts") await refreshDrafts();
        setPhoto(null);
      } catch (cause) { setLoadFailed(true); throw cause; }
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
      if (response) { void load("notifications"); void Notifications.clearLastNotificationResponseAsync(); }
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
      setScreen("home"); setLoadFailed(false); setNotice(""); return true;
    });
    return () => listener.remove();
  }, [screen, session.role, tenantTab, selectTenantTab]);

  return <>
    {busy ? <ActivityIndicator accessibilityLabel="Loading workspace" color="#14634e" /> : null}
    {notice ? <Text accessibilityRole="alert" style={styles.subtitle}>{notice}</Text> : null}
    {screen !== "home" ? <Button label="Back to home" onPress={() => { setScreen("home"); setLoadFailed(false); setNotice(""); }} disabled={busy} secondary /> : null}
    {session.role === "TENANT" && !session.requiresAccountSetup ? <View style={{ display: screen === "home" ? "flex" : "none" }}>
      <TenantHome refreshKey={homeRevision} active={screen === "home"} tab={tenantTab} selectTab={selectTenantTab} session={session} busy={busy} openNative={target => void load(target)} openWeb={openTenantWorkspace} openPlatform={() => setScreen("platform-home")} onError={onError} />
    </View> : null}
    {session.requiresAccountSetup ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Complete account setup</Text>
      {session.mustChangePassword ? <>
        <Field label="Temporary password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} editable={!busy} />
        <Field label="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} editable={!busy} />
        <Field label="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} editable={!busy} />
      </> : null}
      <Button label="Read terms" onPress={() => void Linking.openURL(`${api.websiteUrl()}/terms`).catch(onError)} secondary />
      <Button label="Read privacy notice" onPress={() => void Linking.openURL(`${api.websiteUrl()}/privacy`).catch(onError)} secondary />
      <Button label="I accept the terms of use" checked={acceptedTerms} onPress={() => setAcceptedTerms(!acceptedTerms)} disabled={busy} secondary />
      <Button label="Complete setup" disabled={busy || !acceptedTerms} onPress={() => void run(async () => {
        await api.completeSetup({ currentPassword, newPassword, confirmPassword, acceptedTerms: true });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); await refreshSession();
      })} />
    </View> : loadingScreen ? <View style={styles.card}><Text style={styles.cardTitle}>Loading…</Text><Text style={styles.subtitle}>Getting your latest information.</Text></View> : loadFailed ? <View style={styles.card}><Text style={styles.subtitle}>This screen could not load. Check your connection and retry.</Text><Button label="Try again" onPress={() => void load(screen)} disabled={busy} /></View> : screen === "home" && session.role === "TENANT" ? null : (screen === "platform-home" || screen === "home" && (["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.role ?? "") || ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole))) ? <ManagementHome session={session} busy={busy} initialKind={screen === "platform-home" ? "platform" : undefined} openNative={target => void load(target)} openWeb={openWorkspace} onError={onError} /> : screen === "home" ? <>
      <Text style={styles.title}>Hello, {session.fullName.split(" ")[0]}</Text>
      <Text style={styles.subtitle}>{session.organizationName ?? "EstateDesk"} · {session.role?.replaceAll("_", " ")}</Text>
      <Dashboard session={session} />
      {session.role === "CARETAKER" ? <Button label="Submit meter readings" onPress={() => void load("meters")} disabled={busy} /> : null}
      {session.features.includes("leases") ? <Button label="My leases and tenancy history" onPress={() => void load("leases")} disabled={busy} secondary /> : null}
      {session.features.includes("move-outs") ? <Button label="Move-out and inspection progress" onPress={() => void load("move-outs")} disabled={busy} secondary /> : null}
      {session.features.includes("caretaker-issues") ? <Button label="Maintenance work orders" onPress={() => void load("work-orders")} disabled={busy} /> : null}
      {session.features.includes("portfolio") ? <Button label="Property units and occupancy" onPress={() => void load("portfolio")} disabled={busy} /> : null}
      {session.features.includes("documents") ? <Button label="Receipts and lease documents" disabled={busy} onPress={() => void load("documents")} secondary /> : null}
      {session.features.includes("payment-review") ? <Button label="Review pending payments" disabled={busy} onPress={() => void load("payment-review")} /> : null}
      {session.features.includes("inspections") ? <Button label="Assigned inspections and handover reports" disabled={busy} onPress={() => void load("inspections")} /> : null}
      {session.features.includes("visitors") ? <Button label="Visitor QR passes" disabled={busy} onPress={() => void load("visitors")} /> : null}
      {session.features.includes("gate") ? <Button label="Scan visitor passes and admit" disabled={busy} onPress={() => void load("gate")} /> : null}
      {session.role === "CARETAKER" ? <Button label="Saved field drafts and sync" disabled={busy} onPress={() => void load("drafts")} secondary /> : null}
      <Button label="Notifications" onPress={() => void load("notifications")} disabled={busy} secondary />
      <Button label="Refresh workspace" onPress={() => void run(refreshSession)} disabled={busy} secondary />
      <Button label="Open website" onPress={() => void Linking.openURL(`${api.websiteUrl()}/login`).catch(onError)} secondary />
    </> : screen === "documents" ? <DocumentsPanel documents={documents} busy={busy} run={run} refresh={async () => setDocuments(await api.getDocuments())} />
      : screen === "payment-review" ? <PaymentReviewPanel data={review} currency={session.currencyCode} busy={busy} run={run} load={async page => setReview(await api.getReviewPayments(page))} />
      : screen === "visitors" ? <VisitorsPanel visitors={visitors} busy={busy} run={run} refresh={async () => setVisitors(await api.getVisitors())} />
      : screen === "gate" ? <GatePanel busy={busy} run={run} />
      : screen === "drafts" ? <DraftsPanel drafts={drafts} busy={busy} run={run} refresh={refreshDrafts} />
      : screen === "inspections" ? <InspectionsPanel inspections={inspections} session={session} busy={busy} run={run} refresh={async () => setInspections(await api.getInspections())} saved={() => setNotice("Inspection draft saved. Open saved field drafts to review and sync.")} onError={onError} />
      : screen === "leases" ? <LeasesPanel leases={leases} currency={session.currencyCode} busy={busy} refresh={() => void load("leases")} />
      : screen === "move-outs" ? <MoveOutsPanel notices={moveOuts} busy={busy} refresh={() => void load("move-outs")} />
      : screen === "work-orders" ? <WorkOrdersPanel orders={workOrders} busy={busy} refresh={() => void load("work-orders")} update={(input, evidence) => run(async () => {
        await api.updateWorkOrder(input, evidence); setWorkOrders(await api.getWorkOrders());
        setNotice(input.action === "complete" ? "Completion report submitted for office review." : input.action === "note" ? "Progress note saved." : "Work started.");
      })} onError={onError} />
      : screen === "portfolio" ? <PortfolioPanel data={portfolio} currency={session.currencyCode} busy={busy} search={(query, status, page) => run(async () => { setPortfolio(await api.getPortfolio(query, status, page)); })} />
      : screen === "profile" && profile ? <ProfilePanel profile={profile} busy={busy} run={run} refresh={async () => { setProfile(await api.getProfile()); await refreshSession(); }} />
      : screen === "community" ? <CommunityPanel notices={community} busy={busy} run={run} refresh={async () => setCommunity(await api.getCommunity())} />
      : screen === "expenditures" ? <ExpendituresPanel data={expenditures} busy={busy} run={run} load={async page => setExpenditures(await api.getExpenditures(page))} />
      : screen === "help" ? <>
        <Text style={styles.title}>Help & guidance</Text>
        <View style={styles.card}><Text style={styles.cardTitle}>Bills and payments</Text><Text style={styles.subtitle}>Open Bills to review balances. Choose an outstanding bill to submit a payment. Check payment history before retrying an uncertain payment.</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Repairs</Text><Text style={styles.subtitle}>Open Maintenance to report a problem, choose its priority and attach a photo. Follow updates in your requests and notifications.</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Documents</Text><Text style={styles.subtitle}>Open Documents to preview or share available receipts and lease PDFs. Invoices can be shared from the invoice list.</Text></View>
      </> : screen === "invoices" ? <>
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
      {issues?.issues.map(item => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.status} · {item.priority}</Text><Text style={styles.subtitle}>{item.description}</Text></View>)}
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
    <Button label="Sign out" onPress={logout} disabled={busy} secondary />
  </>;
}
