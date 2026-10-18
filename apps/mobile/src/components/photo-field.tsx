import { useState } from "react";
import { Image, Text, View } from "react-native";
import { pickPhoto, type Photo } from "../photos";
import { Button, styles } from "./ui";
export function PhotoField({ photo, change, busy, onError, label = "Evidence photo (optional)" }: { photo: Photo | null; change: (value: Photo | null) => void; busy: boolean; onError: (error: unknown) => void; label?: string }) {
  const [picking, setPicking] = useState(false);
  async function choose(camera: boolean) { setPicking(true); try { const result = await pickPhoto(camera); if (result) change(result); } catch (error) { onError(error); } finally { setPicking(false); } }
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text>
    {photo ? <><Image source={{ uri: photo.uri }} alt="Selected evidence" accessibilityLabel="Selected evidence" style={{ height: 180, width: "100%", borderRadius: 10 }} resizeMode="contain" /><Button label="Remove photo" onPress={() => change(null)} disabled={busy || picking} secondary /></> : null}
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}><Button label="Take photo" onPress={() => void choose(true)} disabled={busy || picking} secondary /><Button label="Choose photo" onPress={() => void choose(false)} disabled={busy || picking} secondary /></View>
  </View>;
}
