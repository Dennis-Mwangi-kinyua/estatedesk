"use client";
import Image from "next/image";
import { useState } from "react";
export function StayGallery({ title, images }: { title: string; images: { id: string; url: string }[] }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  return <section aria-label="Stay photos" className="space-y-3">
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted"><Image src={images[Math.min(active, images.length - 1)].url} alt={`${title} — photo ${active + 1}`} fill priority sizes="(min-width: 1024px) 65vw, 100vw" className="object-cover" /><span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">{active + 1} / {images.length}</span></div>
    <div className="flex gap-3 overflow-x-auto pb-2">{images.map((image, index) => <button type="button" key={image.id} aria-label={`View photo ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${active === index ? "border-emerald-500" : "border-transparent"}`}><Image src={image.url} alt={`${title} thumbnail ${index + 1}`} fill sizes="112px" className="object-cover" /></button>)}</div>
  </section>;
}
