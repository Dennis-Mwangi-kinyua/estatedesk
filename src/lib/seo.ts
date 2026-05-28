import type { Metadata } from "next";

export const SITE_NAME = "EstateDesk";
export const SITE_DESCRIPTION =
  "EstateDesk is property management software for Kenya, helping landlords and property managers handle tenants, leases, rent, water bills, caretakers, inspections, and maintenance in one workspace.";
export const DEFAULT_SITE_URL = "https://estatedesk.co.ke";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    DEFAULT_SITE_URL;

  return raw.replace(/\/$/, "").replace("https://www.estatedesk.co.ke", DEFAULT_SITE_URL);
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function publicPageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_KE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
