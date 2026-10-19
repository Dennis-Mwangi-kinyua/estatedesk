import { useRef, useState } from "react";
import { Image, PanResponder, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { base64, signaturePng, type SignatureStroke } from "../signature-image";
import { Button, styles } from "./ui";

export type SignatureValue = { signatureMethod: "TYPED" | "DRAWN" | "UPLOADED"; signatureData?: string };
export function SignatureField({ value, change, disabled }: { value: SignatureValue; change: (value: SignatureValue) => void; disabled?: boolean }) {
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const points = useRef<SignatureStroke[]>([]);
  const dimensions = useRef({ width: 1, height: 160 });
  const [error, setError] = useState("");
  const controls = useRef({ change, disabled }); controls.current = { change, disabled };
  const point = (x: number, y: number) => ({ x: Math.max(0, Math.min(1, x / dimensions.current.width)), y: Math.max(0, Math.min(1, y / dimensions.current.height)) });
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !controls.current.disabled,
    onMoveShouldSetPanResponder: () => !controls.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: event => { points.current = [...points.current, [point(event.nativeEvent.locationX, event.nativeEvent.locationY)]]; setStrokes([...points.current]); controls.current.change({ signatureMethod: "DRAWN" }); },
    onPanResponderMove: event => {
      if (points.current.reduce((n, stroke) => n + stroke.length, 0) >= 2000) return;
      const stroke = points.current.at(-1); if (!stroke) return;
      const next = point(event.nativeEvent.locationX, event.nativeEvent.locationY), last = stroke.at(-1)!;
      if (Math.hypot(next.x - last.x, next.y - last.y) < 0.003) return;
      stroke.push(next); setStrokes(points.current.map(row => [...row]));
    },
    onPanResponderRelease: () => { try { controls.current.change({ signatureMethod: "DRAWN", signatureData: `data:image/png;base64,${base64(signaturePng(points.current))}` }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Draw your signature again."); } },
    onPanResponderTerminate: () => { controls.current.change({ signatureMethod: "DRAWN" }); setError("Drawing was interrupted. Clear and draw your signature again."); },
  })).current;
  async function upload() {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], exif: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0], context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1024 || asset.height > 1024) context.resize(asset.width >= asset.height ? { width: 1024 } : { height: 1024 });
      try {
        const image = await context.renderAsync();
        try {
          const file = new File((await image.saveAsync({ format: SaveFormat.PNG })).uri);
          try {
            if (file.size > 256 * 1024) throw new Error("Choose a simpler signature image under 256 KB after conversion.");
            change({ signatureMethod: "UPLOADED", signatureData: `data:image/png;base64,${await file.base64()}` });
          } finally { if (file.exists) file.delete(); }
        } finally { image.release(); }
      } finally { context.release(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to choose signature."); }
  }
  function mode(signatureMethod: SignatureValue["signatureMethod"]) { points.current = []; setStrokes([]); setError(""); change({ signatureMethod }); }
  return <View style={{ gap: 12 }}>
    <Text style={styles.label}>Signature style</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{(["TYPED", "DRAWN", "UPLOADED"] as const).map(method => <Button key={method} label={method === "TYPED" ? "Type" : method === "DRAWN" ? "Draw" : "Upload"} selected={value.signatureMethod === method} secondary={value.signatureMethod !== method} disabled={disabled} onPress={() => mode(method)} />)}</View>
    {value.signatureMethod === "DRAWN" ? <>
      <Text style={styles.subtitle}>Draw with your finger inside the box, then lift your finger to save the stroke.</Text>
      <View accessibilityLabel="Signature drawing area" onLayout={event => { dimensions.current = event.nativeEvent.layout; }} {...responder.panHandlers} style={{ height: 160, backgroundColor: "white", borderWidth: 1, borderColor: "#cddbd2", borderRadius: 12, overflow: "hidden" }}>
        {strokes.flatMap((stroke, index) => stroke.slice(1).map((end, i) => { const start = stroke[i], dx = (end.x - start.x) * dimensions.current.width, dy = (end.y - start.y) * dimensions.current.height; return <View key={`${index}:${i}`} pointerEvents="none" style={{ position: "absolute", left: start.x * dimensions.current.width, top: start.y * dimensions.current.height, width: Math.hypot(dx, dy), height: 3, backgroundColor: "#1e1e1e", transformOrigin: "left center", transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] }} />; }))}
      </View>
      <Button label="Clear signature" secondary disabled={disabled} onPress={() => mode("DRAWN")} />
    </> : value.signatureMethod === "UPLOADED" ? <Button label="Choose signature image" secondary disabled={disabled} onPress={() => void upload()} /> : null}
    {value.signatureData ? <Image source={{ uri: value.signatureData }} accessibilityLabel="Your signature preview" resizeMode="contain" style={{ height: 100, width: "100%", backgroundColor: "white" }} /> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
