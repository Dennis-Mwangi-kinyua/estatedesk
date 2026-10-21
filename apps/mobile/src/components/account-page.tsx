import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { AppIcon, IconTile } from "./app-icon";
import { Button, mobileTheme, styles } from "./ui";
import * as api from "../api";
import { pickPhoto, removePickedPhoto } from "../photos";
import type { Photo } from "../photos";

type AccountTarget = "security" | "notifications" | "help" | "profile";

const settings: { title: string; detail: string; icon: "user" | "lock" | "bell" | "book-open"; target: AccountTarget; tenantOnly?: boolean }[] = [
  { title: "Personal details", detail: "Profile and next of kin", icon: "user", target: "profile", tenantOnly: true },
  { title: "Security", detail: "Password and signed-in devices", icon: "lock", target: "security" },
  { title: "Notifications", detail: "Device alerts and preferences", icon: "bell", target: "notifications" },
  { title: "Help & guidance", detail: "Find answers and instructions", icon: "book-open", target: "help" },
];

export function AccountPage({ session, busy, loggingOut, logout, open, refreshSession }: {
  session: MobileSession; busy: boolean; loggingOut: boolean; logout: () => void;
  open: (screen: AccountTarget) => void;
  refreshSession: () => Promise<void>;
}) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 700 && fontScale <= 1.35;
  const role = (session.role ?? session.platformRole).replaceAll("_", " ").toLowerCase();
  const initials = session.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";
  const actions = settings.filter(item => !item.tenantOnly || session.role === "TENANT");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  async function choosePhoto(camera: boolean) {
    if (photoBusy || busy) return;
    let photo: Photo | null = null;
    setPhotoBusy(true); setPhotoError("");
    try {
      photo = await pickPhoto(camera);
      if (!photo) return;
      await api.updateProfilePicture(photo);
      setImageFailed(false);
      await refreshSession();
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Unable to update your profile photo.");
    } finally {
      if (photo) removePickedPhoto(photo);
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (photoBusy || busy) return;
    setPhotoBusy(true); setPhotoError("");
    try { await api.deleteProfilePicture(); setImageFailed(false); await refreshSession(); }
    catch (error) { setPhotoError(error instanceof Error ? error.message : "Unable to remove your profile photo."); }
    finally { setPhotoBusy(false); }
  }

  function showPhotoOptions() {
    const buttons = session.profileImageUrl ? [
      { text: "Choose a new photo", onPress: () => void choosePhoto(false) },
      { text: "Remove photo", style: "destructive" as const, onPress: () => void removePhoto() },
      { text: "Cancel", style: "cancel" as const },
    ] : [
      { text: "Take a photo", onPress: () => void choosePhoto(true) },
      { text: "Choose from library", onPress: () => void choosePhoto(false) },
      { text: "Cancel", style: "cancel" as const },
    ];
    Alert.alert("Profile photo", "Add a photo so people can recognize your account.", buttons);
  }

  return <View style={s.page}>
    <View style={s.heading}>
      <Text accessibilityRole="header" style={styles.title}>My account</Text>
      <Text style={styles.subtitle}>Profile and preferences.</Text>
    </View>

    <View style={[s.identity, wide && s.identityWide]}>
      <Pressable accessibilityRole="button" accessibilityLabel={photoBusy ? "Updating profile photo" : "Change profile photo"} disabled={busy || photoBusy} onPress={showPhotoOptions} style={({ pressed }) => [s.avatar, (pressed || photoBusy) && { opacity: 0.7 }]}>
        {photoBusy ? <ActivityIndicator color="#14634e" /> : session.profileImageUrl && !imageFailed ? <Image source={{ uri: session.profileImageUrl }} onError={() => setImageFailed(true)} style={s.avatarImage} /> : <Text style={s.initials}>{initials}</Text>}
        <View style={s.cameraBadge}><AppIcon name="camera" size={13} color="#ffffff" /></View>
      </Pressable>
      <View style={s.identityInfo}>
        <Text accessibilityRole="header" style={s.name}>{session.fullName}</Text>
        <Text style={s.organization}>{session.organizationName ?? "EstateDesk"}</Text>
        <View style={s.rolePill}><AppIcon name="user-check" size={15} color="#14634e" /><Text style={s.role}>{role}</Text></View>
      </View>
    </View>
    {photoError ? <Text accessibilityRole="alert" style={styles.error}>{photoError}</Text> : null}

    <View style={s.sectionHeading}>
      <Text accessibilityRole="header" style={s.sectionTitle}>Settings</Text>
    </View>
    <View style={[s.grid, wide && s.gridWide]}>
      {actions.map(item => <Pressable key={item.target} accessibilityRole="button" accessibilityLabel={item.title} accessibilityHint={item.detail}
        accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => open(item.target)}
        style={({ pressed }) => [s.settingCard, wide && s.settingCardWide, pressed && s.pressed, busy && { opacity: 0.55 }]}>
        <IconTile name={item.icon} size={21} />
        <View style={s.settingCopy}><Text style={s.settingTitle}>{item.title}</Text><Text style={s.settingDetail}>{item.detail}</Text></View>
        <AppIcon name="chevron-right" size={19} color="#85968d" />
      </Pressable>)}
    </View>

    <View style={s.logout}>
      <View style={s.logoutCopy}><Text style={s.logoutTitle}>Sign out</Text><Text style={styles.subtitle}>End this session on this device.</Text></View>
      <Button label={loggingOut ? "Signing out…" : "Sign out"} icon="log-out" onPress={logout} disabled={busy} secondary />
    </View>
  </View>;
}

const s = StyleSheet.create({
  page: { gap: mobileTheme.space.xl },
  heading: { gap: 5 },
  identity: { minHeight: 116, backgroundColor: mobileTheme.color.surface, borderWidth: 1, borderColor: mobileTheme.color.border, borderRadius: mobileTheme.radius.card, padding: 18, gap: 15, flexDirection: "row", alignItems: "center" },
  identityWide: { padding: 20, gap: 17 },
  avatar: { position: "relative", width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: "#e7f1ea", overflow: "visible" },
  avatarImage: { width: 62, height: 62, borderRadius: 31 },
  cameraBadge: { position: "absolute", right: -2, bottom: -2, width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#14634e", borderColor: "#ffffff", borderWidth: 2 },
  initials: { fontSize: 22, lineHeight: 29, color: "#174a3b", fontWeight: "700", letterSpacing: -0.4 },
  identityInfo: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 4 },
  name: { color: "#173e32", fontSize: 19, lineHeight: 26, fontWeight: "700", letterSpacing: -0.3 },
  organization: { color: "#62766a", fontSize: 13, lineHeight: 19 },
  rolePill: { marginTop: 3, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#edf5ef", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  role: { color: "#14634e", fontSize: 11, lineHeight: 16, fontWeight: "700", textTransform: "capitalize", letterSpacing: 0.4 },
  sectionHeading: { gap: 4 },
  sectionTitle: { color: "#173e32", fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  grid: { gap: 11 },
  gridWide: { flexDirection: "row", flexWrap: "wrap" },
  settingCard: { minHeight: 82, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#dce6e0", backgroundColor: "#ffffff", flexDirection: "row", alignItems: "center", gap: 13 },
  settingCardWide: { width: "48.5%", flexGrow: 1, flexBasis: "45%" },
  settingCopy: { flex: 1, minWidth: 0, gap: 3 },
  settingTitle: { color: "#173e32", fontSize: 15, lineHeight: 21, fontWeight: "700" },
  settingDetail: { color: "#62766a", fontSize: 12, lineHeight: 17 },
  pressed: { backgroundColor: "#edf5f0", borderColor: "#83aa92", transform: [{ scale: 0.99 }] },
  logout: { borderTopWidth: 1, borderTopColor: "#dce6df", paddingTop: 20, gap: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  logoutCopy: { flex: 1, minWidth: 180, gap: 2 },
  logoutTitle: { color: "#173e32", fontSize: 15, fontWeight: "700" },
});
