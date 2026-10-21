import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import type { MobileSession } from "@estatedesk/contracts/mobile";
import { draftScope, listDrafts, type Draft } from "../drafts";
import { DraftsPanel } from "./field-panels";
import { Button, styles } from "./ui";
export function OfflineWorkspace({ session, reconnect, onError, logout, loggingOut }: { session: MobileSession; reconnect: () => Promise<void>; onError: (error: unknown) => void; logout: () => void; loggingOut: boolean }) {
  const lock = useRef(false);
  const [drafts, setDrafts] = useState<Draft[]>([]); const [busy, setBusy] = useState(false);
  async function refresh() { setDrafts(await listDrafts(await draftScope(session))); }
  useEffect(() => { void draftScope(session).then(listDrafts).then(setDrafts).catch(onError); /* Cached identity only unlocks local drafts; server reauthorizes sync. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function run(action: () => Promise<void>) { if (lock.current) return false; lock.current = true; setBusy(true); try { await action(); return true; } catch (error) { onError(error); return false; } finally { lock.current = false; setBusy(false); } }
  return <><Text style={styles.title}>Offline field workspace</Text><Text style={styles.subtitle}>{session.organizationName} · Reconnect to load current assignments and other features.</Text>{busy ? <ActivityIndicator /> : null}<DraftsPanel drafts={drafts} busy={busy} run={run} refresh={refresh} /><Button label="Reconnect to full workspace" disabled={busy} onPress={() => void run(reconnect)} /><Button label={loggingOut ? "Signing out…" : "Sign out when connected"} secondary disabled={busy} onPress={logout} /></>;
}
