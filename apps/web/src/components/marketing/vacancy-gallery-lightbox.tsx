"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type GalleryImage = {
  key: string;
  fileName: string | null;
  src: string;
};

type VacancyGalleryLightboxProps = {
  title: string;
  rentLabel: string;
  viewingLabel: string;
  images: GalleryImage[];
};

export function VacancyGalleryLightbox({
  title,
  rentLabel,
  viewingLabel,
  images,
}: VacancyGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const hasImages = images.length > 0;
  const active = hasImages ? images[Math.min(activeIndex, images.length - 1)] : null;

  const show = useCallback((index: number) => {
    setActiveIndex(index);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const prev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((current) => (current + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    }

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, prev, next]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => (hasImages ? show(0) : undefined)}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left dark:border-white/10 dark:bg-slate-800"
        aria-label={hasImages ? "Open photo gallery" : "No photos available"}
      >
        {active ? (
          <Image
            src={active.src}
            alt={active.fileName ?? title}
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              No images
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-[0_4px_14px_rgba(5,150,105,0.45)]">
            Vacant now
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-md">
            {viewingLabel}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Monthly rent
          </p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">
            {rentLabel}
          </p>
        </div>
        {hasImages && images.length > 1 ? (
          <span className="absolute bottom-4 left-4 z-10 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
            {images.length} photos · tap to enlarge
          </span>
        ) : null}
      </button>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.slice(0, 8).map((asset, index) => (
            <button
              key={`${asset.key}-${index}`}
              type="button"
              onClick={() => show(index)}
              className={`relative aspect-[4/3] overflow-hidden rounded-xl border bg-slate-100 transition dark:bg-slate-800 ${
                index === activeIndex
                  ? "border-sky-400 ring-2 ring-sky-200 dark:border-sky-400 dark:ring-sky-500/30"
                  : "border-slate-200 dark:border-white/10"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <Image
                src={asset.src}
                alt={asset.fileName ?? `${title} photo ${index + 1}`}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {open && active ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vacancy photo gallery"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  prev();
                }}
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[min(80vh,720px)] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.fileName ?? title}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
