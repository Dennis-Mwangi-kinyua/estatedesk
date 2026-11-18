import { useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import * as api from "../api";
import { Button, Field, styles } from "./ui";

export function ProviderJobActions({ jobId, status, onUpdated, onError }: { jobId: string; status: string; onUpdated: () => void; onError: (error: unknown) => void }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const run = async (operation: "accept" | "decline" | "submit") => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await api.updateProviderJob(jobId, operation, notes); setNotes(""); onUpdated(); }
    catch (cause) { setError("The result could not be confirmed. Refresh Today before trying again."); onError(cause); }
    finally { pending.current = false; setBusy(false); }
  };
  const confirm = (operation: "accept" | "decline" | "submit") => Alert.alert("Update this job?", operation === "submit" ? "Send completion notes to the organization for review? This does not mark the job approved." : operation === "accept" ? "Accept this assignment and start work?" : "Decline this assignment?", [{ text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: () => { void run(operation); } }]);
  if (!["ASSIGNED", "IN_PROGRESS"].includes(status)) return null;
  return <View style={{ gap: 8 }}>
    {status === "ASSIGNED" ? <><Button label="Accept and start work" disabled={busy} onPress={() => confirm("accept")} /><Button label="Decline assignment" secondary disabled={busy} onPress={() => confirm("decline")} /></> : <><Field label="Completion notes" value={notes} onChangeText={setNotes} editable={!busy} multiline maxLength={3000} /><Button label="Submit work for review" disabled={busy || notes.trim().length < 10} onPress={() => confirm("submit")} /></>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
