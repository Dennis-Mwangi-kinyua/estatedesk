import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "../api";
import { Button, styles } from "./ui";
import { IconTile } from "./app-icon";

/** Reads the exact shared website text, including during mandatory setup. */
export function LegalReader({ kind, close, onError }: { kind: "terms" | "privacy"; close: () => void; onError: (error: unknown) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getLegal>> | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    // Reset the request view while synchronizing with a new server query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(""); setData(null);
    void api.getLegal(kind).then(result => { if (active) setData(result); }).catch(cause => {
      if (!active) return;
      if (cause instanceof api.ApiError && cause.status === 401) onError(cause);
      setError(cause instanceof Error ? cause.message : "Unable to load this document.");
    });
    return () => { active = false; };
  }, [kind, revision, onError]);
  return <Modal visible animationType="slide" onRequestClose={close}><SafeAreaView style={{ flex: 1, backgroundColor: "#f3f6f3" }}>
    <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}><Button label="Back to account setup" icon="arrow-left" secondary onPress={close} /></View>
    <ScrollView contentContainerStyle={{ width: "100%", maxWidth: 760, alignSelf: "center", padding: 20, paddingBottom: 40, gap: 16 }}>
      <IconTile name={kind === "terms" ? "file-text" : "shield"} />
      <Text accessibilityRole="header" style={styles.title}>{data?.title ?? (kind === "terms" ? "Terms of service" : "Privacy policy")}</Text>
      {!data && !error ? <ActivityIndicator accessibilityLabel="Loading document" color="#14634e" /> : null}
      {error ? <View style={styles.card}><Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text><Button label="Try again" onPress={() => setRevision(value => value + 1)} /></View> : null}
      {data ? <><Text style={styles.subtitle}>{data.description}</Text><Text style={styles.label}>Updated {data.updatedAt}</Text>{data.sections.map(section => <View key={section.title} style={styles.card}><Text accessibilityRole="header" style={styles.cardTitle}>{section.title}</Text>{section.body.map((paragraph, index) => <Text selectable key={index} style={styles.subtitle}>{paragraph}</Text>)}</View>)}</> : null}
    </ScrollView>
  </SafeAreaView></Modal>;
}
