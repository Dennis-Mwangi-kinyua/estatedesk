export type VacancySharePlatform = "whatsapp" | "facebook" | "x" | "linkedin";

export function vacancyShareHref(platform: VacancySharePlatform, url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  if (platform === "whatsapp") return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
}