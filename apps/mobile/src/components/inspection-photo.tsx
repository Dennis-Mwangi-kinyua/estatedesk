import { useState } from "react";
import { Image, Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "../api";
import { Button, styles } from "./ui";

export function InspectionPhoto({ inspectionId, photo, busy, run }: { inspectionId: string; photo: { id: string; label: string }; busy: boolean; run: (action: () => Promise<void>) => Promise<boolean> }) {
  const [uri, setUri] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  return <View style={{ gap: 10 }}>
    <Button label={`View photo · ${photo.label}`} secondary disabled={busy} onPress={() => void run(async () => { setUri(await api.getInspectionPhoto(inspectionId, photo.id)); setOpened(true); })} />
    {opened && uri ? <Modal animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { setOpened(false); setUri(null); }}><SafeAreaView style={{ flex: 1, backgroundColor: "#f3f6f4", padding: 20, gap: 16 }}>
      <Button label="Back to inspection" secondary onPress={() => { setOpened(false); setUri(null); }} /><Text accessibilityRole="header" style={styles.cardTitle}>{photo.label}</Text>
      <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ flexGrow: 1 }}><Image source={{ uri }} accessibilityLabel={`${photo.label} inspection evidence`} resizeMode="contain" style={{ flex: 1, minHeight: 400, width: "100%" }} /></ScrollView>
    </SafeAreaView></Modal> : null}
  </View>;
}
