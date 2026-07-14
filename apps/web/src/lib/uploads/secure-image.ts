const IMAGE_SIGNATURES = [
  {
    mimeType: "image/jpeg",
    extension: ".jpg",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    mimeType: "image/png",
    extension: ".png",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  {
    mimeType: "image/webp",
    extension: ".webp",
    matches: (bytes: Uint8Array) =>
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP",
  },
] as const;

export type ValidatedImage = {
  buffer: Buffer;
  mimeType: (typeof IMAGE_SIGNATURES)[number]["mimeType"];
  extension: (typeof IMAGE_SIGNATURES)[number]["extension"];
  size: number;
};

export function validateImageBytes(
  bytes: Uint8Array,
  options?: { maxBytes?: number; allowedMimeTypes?: readonly string[] },
): ValidatedImage {
  const maxBytes = options?.maxBytes ?? 5 * 1024 * 1024;
  if (bytes.length === 0) throw new Error("The image file is empty.");
  if (bytes.length > maxBytes) throw new Error("The image file is too large.");

  const detected = IMAGE_SIGNATURES.find((signature) => signature.matches(bytes));
  if (!detected) {
    throw new Error("Only genuine JPEG, PNG, or WebP images are allowed.");
  }
  if (
    options?.allowedMimeTypes &&
    !options.allowedMimeTypes.includes(detected.mimeType)
  ) {
    throw new Error("This image format is not allowed here.");
  }

  return {
    buffer: Buffer.from(bytes),
    mimeType: detected.mimeType,
    extension: detected.extension,
    size: bytes.length,
  };
}

export async function validateImageFile(
  file: File,
  options?: { maxBytes?: number; allowedMimeTypes?: readonly string[] },
) {
  const maxBytes = options?.maxBytes ?? 5 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("The image file is too large.");
  return validateImageBytes(new Uint8Array(await file.arrayBuffer()), options);
}
