import * as ImagePicker from "expo-image-picker";
import type { Photo } from "./photo-types";
export type { Photo } from "./photo-types";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Directory, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
const evidenceDirectory = () => new Directory(Paths.cache, "estatedesk-evidence");
export function clearEvidenceCache() { const dir = evidenceDirectory(); if (dir.exists) dir.delete(); }
export async function pickPhoto(camera: boolean): Promise<Photo | null> {
  if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error("Camera access is required to take a photo. You can choose a photo instead.");
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.45, exif: false };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  // Normalize HEIC/PNG camera-library results and bound image dimensions before upload.
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > 1600 || asset.height > 1600) context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
  try {
    const image = await context.renderAsync();
    try {
      const normalized = new File((await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.65 })).uri);
      if (normalized.size > 2 * 1024 * 1024) { normalized.delete(); throw new Error("Choose a smaller photo (under 2MB)."); }
      evidenceDirectory().create({ intermediates: true, idempotent: true });
      const output = new File(evidenceDirectory(), `${randomUUID()}.jpg`);
      normalized.move(output);
      return { uri: output.uri, name: "evidence.jpg", type: "image/jpeg" };
    } finally { image.release(); }
  } finally {
    context.release();
    // Picker cache copies are temporary; never delete the user's original library photo.
    if (asset.uri.startsWith(`${Paths.cache.uri.replace(/\/$/, "")}/`)) { const source = new File(asset.uri); if (source.exists) source.delete(); }
  }
}
export function attachmentForm(body: object, photos: Record<string, Photo> = {}, clientId?: string) {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) form.append(key, String(value));
  if (clientId) form.append("clientId", clientId);
  for (const [key, photo] of Object.entries(photos)) form.append(key, photo as unknown as Blob);
  return form;
}
