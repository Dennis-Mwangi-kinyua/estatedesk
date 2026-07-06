import type { Metadata } from "next";

export const SITE_NAME = "EstateDesk";
export const SITE_DESCRIPTION =
  "EstateDesk is property management software for landlords and property managers in Kenya, East Africa, Dubai, and global rental markets. Manage tenants, leases, rent, water bills, caretaker field operations, offline meter readings, maintenance SLAs, inspections, vacant houses, WhatsApp tenant contact, and staff access in one secure workspace.";
export const DEFAULT_SITE_URL = "https://estatedesk.co.ke";

export const PUBLIC_LOCALES = [
  "en",
  "en-KE",
  "en-UG",
  "en-TZ",
  "en-RW",
  "en-AE",
  "en-US",
  "en-GB",
  "en-CA",
  "en-AU",
  "en-ZA",
  "en-IN",
] as const;

export const SEO_KEYWORDS = [
  "EstateDesk",
  "property management software Kenya",
  "landlord software Kenya",
  "rental property management system Kenya",
  "rent management system",
  "tenant management software Kenya",
  "caretaker management software",
  "caretaker field operations software",
  "property maintenance SLA software",
  "offline meter reading app",
  "Swahili property management software",
  "WhatsApp tenant communication property management",
  "water billing software Kenya",
  "lease management software Kenya",
  "vacant houses Kenya",
  "houses for rent Kenya",
  "property manager software Nairobi",
  "real estate management software Kenya",
  "property management software East Africa",
  "landlord software East Africa",
  "property management software Uganda",
  "property management software Tanzania",
  "property management software Rwanda",
  "property management software Dubai",
  "property management software UAE",
  "real estate management software Dubai",
  "rental management software for landlords",
  "property management software for small landlords",
  "cloud property management software",
  "online property management system",
  "rental portfolio management software",
] as const;

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
  keywords = [],
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: readonly string[];
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`;
  return {
    title: {
      absolute: resolvedTitle,
    },
    applicationName: SITE_NAME,
    publisher: SITE_NAME,
    creator: SITE_NAME,
    category: "Property management software",
    description,
    keywords: [...SEO_KEYWORDS, ...keywords],
    alternates: {
      canonical: url,
      languages: {
        "en-KE": url,
        "x-default": url,
      },
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_KE",
      alternateLocale: ["en_US", "en_GB", "en_AE", "en_ZA"],
      images: [
        {
          url: "/images/og-vacancy.svg",
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: ["/images/og-vacancy.svg"],
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

export function noIndexPageMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`;

  return {
    title: {
      absolute: resolvedTitle,
    },
    applicationName: SITE_NAME,
    publisher: SITE_NAME,
    creator: SITE_NAME,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: resolvedTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_KE",
      images: [
        {
          url: "/images/og-vacancy.svg",
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: ["/images/og-vacancy.svg"],
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
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

export const authPageMetadata: Metadata = {
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
