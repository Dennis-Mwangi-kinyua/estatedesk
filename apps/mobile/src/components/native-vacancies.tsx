import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import type { NativeVacancyDetail, NativeVacancyInquiry } from "@estatedesk/contracts/mobile";
import * as api from "../api";
import { AppIcon, IconTile } from "./app-icon";
import { Button, styles } from "./ui";

const blank: NativeVacancyInquiry = { fullName: "", phone: "", email: "", message: "", preferredLocation: "", budget: "", referralSource: "" };
const money = (value: number | null) => value === null ? "Not listed" : `KES ${value.toLocaleString("en-KE")}`;

export function NativeVacancies({ back }: { back: () => void }) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.getNativeVacancies>>["items"]>([]);
  const [detail, setDetail] = useState<NativeVacancyDetail | null>(null);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load(search = appliedQ, town = appliedLocation, nextPage = 1, append = false) {
    setLoading(true); setError("");
    try { const result = await api.getNativeVacancies(search, town, nextPage); setItems(current => append ? [...current, ...result.items] : result.items); setPage(result.page); setHasMore(result.hasMore); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Vacancies are temporarily unavailable."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load("", "", 1); }, []);
  async function open(slug: string) {
    setLoading(true); setError(""); setNotice(""); setInquiryOpen(false);
    try { setDetail(await api.getNativeVacancy(slug)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "This vacancy may no longer be available."); }
    finally { setLoading(false); }
  }
  async function submit() {
    if (!detail) return;
    setBusy(true); setError(""); setNotice("");
    try { const result = await api.sendNativeVacancyInquiry(detail.slug, form); setNotice(result.message); setForm(blank); setInquiryOpen(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your enquiry could not be sent."); }
    finally { setBusy(false); }
  }
  function field(name: keyof NativeVacancyInquiry, label: string, multiline = false, keyboardType: "default" | "phone-pad" | "email-address" = "default") {
    return <View key={name} style={{ gap: 6 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={form[name]} onChangeText={value => setForm(current => ({ ...current, [name]: value }))} editable={!busy} keyboardType={keyboardType} autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"} autoCorrect={keyboardType !== "email-address"} maxLength={name === "message" ? 2000 : 160} multiline={multiline} style={[styles.input, multiline && { minHeight: 110, textAlignVertical: "top" }]} /></View>;
  }
  return <View style={{ gap: 18 }}>
    <Button label={detail ? "Back to vacancies" : "Back to sign in"} icon="arrow-left" secondary onPress={() => { if (detail) { setDetail(null); setInquiryOpen(false); setError(""); } else back(); }} />
    <View style={styles.card}><IconTile name="home" /><Text accessibilityRole="header" style={styles.title}>{detail ? detail.title : "Available vacancies"}</Text><Text style={styles.subtitle}>{detail ? `${detail.location} · ${detail.organization}` : "Browse homes and spaces currently listed by property teams."}</Text></View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {loading ? <View style={styles.card}><ActivityIndicator accessibilityLabel="Loading vacancies" color="#14634e" /><Text style={styles.subtitle}>Loading available listings…</Text></View> : null}
    {detail ? <>
      {detail.imageUrl ? <Image accessibilityLabel={`${detail.title} vacancy photo`} source={{ uri: detail.imageUrl }} resizeMode="cover" style={{ height: 220, borderRadius: 20, backgroundColor: "#e4ece6" }} /> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {[["Monthly rent", money(detail.rent), "credit-card"], ["Deposit", money(detail.deposit), "shield"], ["Bedrooms", detail.bedrooms === null ? "Not listed" : String(detail.bedrooms), "home"], ["Bathrooms", detail.bathrooms === null ? "Not listed" : String(detail.bathrooms), "droplet"]].map(([label, value, icon]) => <View key={label} style={[styles.card, { flexGrow: 1, flexBasis: "45%", minWidth: 140, flexDirection: "row", alignItems: "center", gap: 10 }]}><AppIcon name={icon as "home"} /><View style={{ gap: 4, flex: 1 }}><Text style={styles.label}>{label}</Text><Text style={styles.cardTitle}>{value}</Text></View></View>)}
      </View>
      <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>About this space</Text><Text style={styles.subtitle}>{detail.description}</Text>{detail.address ? <Text style={styles.subtitle}>Address: {detail.address}</Text> : null}{detail.serviceCharge ? <Text style={styles.subtitle}>Service charge: {money(detail.serviceCharge)}</Text> : null}{detail.viewingFee !== null ? <Text style={styles.subtitle}>Viewing fee: {money(detail.viewingFee)}</Text> : null}</View>
      {notice ? <View style={styles.card}><Text accessibilityRole="status" style={styles.subtitle}>{notice}</Text></View> : null}
      {!inquiryOpen ? <Button label="Enquire about this vacancy" icon="send" onPress={() => setInquiryOpen(true)} /> : <View style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>Send an enquiry</Text><Text style={styles.subtitle}>The property team will contact you using the details you provide.</Text>{field("fullName", "Full name")}{field("phone", "Phone number", false, "phone-pad")}{field("email", "Email (optional)", false, "email-address")}{field("message", "Your message", true)}{field("preferredLocation", "Preferred location (optional)")}{field("budget", "Budget (optional)")}{field("referralSource", "How did you find this listing? (optional)")}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<Button label={busy ? "Sending enquiry…" : "Send enquiry"} icon="send" disabled={busy || !form.fullName.trim() || !form.phone.trim() || form.message.trim().length < 5} onPress={() => void submit()} /><Button label="Cancel" secondary disabled={busy} onPress={() => setInquiryOpen(false)} /></View>}
    </> : <>
      <View style={styles.card}><Text style={styles.label}>Search by property or unit</Text><TextInput accessibilityLabel="Search vacancies" value={q} onChangeText={setQ} placeholder="e.g. Kilimani, studio" style={styles.input} returnKeyType="search" editable={!loading} /><Text style={styles.label}>Town or neighborhood</Text><TextInput accessibilityLabel="Vacancy location" value={location} onChangeText={setLocation} placeholder="e.g. Nairobi" style={styles.input} editable={!loading} /><Button label="Search vacancies" icon="search" disabled={loading} onPress={() => { setAppliedQ(q.trim()); setAppliedLocation(location.trim()); void load(q.trim(), location.trim(), 1); }} /></View>
      {items.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`View ${item.title}, ${item.subtitle}`} onPress={() => void open(item.slug)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.78 }]}>
        {item.imageUrl ? <Image accessibilityLabel={`${item.title} vacancy photo`} source={{ uri: item.imageUrl }} resizeMode="cover" style={{ height: 155, borderRadius: 14, backgroundColor: "#e4ece6" }} /> : <IconTile name="home" />}
        <Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.subtitle}</Text><Text style={styles.label}>{item.type.replaceAll("_", " ")}{item.bedrooms !== null ? ` · ${item.bedrooms} bedroom(s)` : ""}</Text><Text style={[styles.cardTitle, { color: "#14634e" }]}>{money(item.rent)} / month</Text><Text style={styles.label}>View details & enquire  ›</Text>
      </Pressable>)}
      {!loading && !items.length ? <View style={styles.card}><IconTile name="search" /><Text style={styles.cardTitle}>No vacancies found</Text><Text style={styles.subtitle}>Try another search or location.</Text></View> : null}
      {hasMore ? <Button label="Load more vacancies" icon="arrow-down" secondary disabled={loading} onPress={() => void load(appliedQ, appliedLocation, page + 1, true)} /> : null}
    </>}
  </View>;
}
