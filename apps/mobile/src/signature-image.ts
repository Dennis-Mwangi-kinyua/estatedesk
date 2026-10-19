export type SignaturePoint = { x: number; y: number };
export type SignatureStroke = SignaturePoint[];
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function base64(bytes: Uint8Array) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += alphabet[n >>> 18] + alphabet[(n >>> 12) & 63] + (i + 1 < bytes.length ? alphabet[(n >>> 6) & 63] : "=") + (i + 2 < bytes.length ? alphabet[n & 63] : "=");
  }
  return out;
}
const u32 = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function chunk(type: string, data: number[]) {
  const bytes = [...Array.from(type, c => c.charCodeAt(0)), ...data];
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return [...u32(data.length), ...bytes, ...u32((crc ^ 0xffffffff) >>> 0)];
}
/** A bounded grayscale PNG, generated locally without a WebView or native dependency. */
export function signaturePng(strokes: SignatureStroke[]): Uint8Array {
  const width = 480, height = 160;
  if (!strokes.some(stroke => stroke.length > 1)) throw new Error("Draw your signature first.");
  if (strokes.reduce((n, stroke) => n + stroke.length, 0) > 2000) throw new Error("Clear the signature and try again with fewer strokes.");
  const pixels = new Uint8Array(width * height).fill(255);
  const dot = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const px = Math.round(x) + dx, py = Math.round(y) + dy;
      if (px >= 0 && px < width && py >= 0 && py < height) pixels[py * width + px] = 30;
    }
  };
  for (const stroke of strokes) for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1], b = stroke[i];
    if (![a.x, a.y, b.x, b.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1)) throw new Error("Invalid signature points.");
    const steps = Math.max(1, Math.ceil(Math.hypot((b.x - a.x) * (width - 1), (b.y - a.y) * (height - 1))));
    for (let step = 0; step <= steps; step++) dot((a.x + (b.x - a.x) * step / steps) * (width - 1), (a.y + (b.y - a.y) * step / steps) * (height - 1));
  }
  const raw: number[] = [];
  for (let y = 0; y < height; y++) { raw.push(0); for (let x = 0; x < width; x++) raw.push(pixels[y * width + x]); }
  const compressed = [0x78, 0x01];
  for (let offset = 0; offset < raw.length; offset += 65535) {
    const length = Math.min(65535, raw.length - offset);
    compressed.push(offset + length === raw.length ? 1 : 0, length & 255, length >>> 8, (~length) & 255, ((~length) >>> 8) & 255);
    for (let i = offset; i < offset + length; i++) compressed.push(raw[i]);
  }
  let a = 1, b = 0;
  for (const byte of raw) { a = (a + byte) % 65521; b = (b + a) % 65521; }
  compressed.push(...u32(((b << 16) | a) >>> 0));
  return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...chunk("IHDR", [...u32(width), ...u32(height), 8, 0, 0, 0, 0]), ...chunk("IDAT", compressed), ...chunk("IEND", [])]);
}
