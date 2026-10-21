import { ScheduledUpdateBanner } from "@/features/platform-updates/banner";
import { Suspense } from "react";
import { SiteExperience } from "@/components/shared/site-experience";
import type { Metadata, Viewport } from "next";
import { MarketingAnalytics } from "@/components/marketing/marketing-analytics";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { MobileSwipeBack } from "@/components/navigation/mobile-swipe-back";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { PwaLaunchScreen } from "@/components/pwa/pwa-launch-screen";
import { PwaExperienceLoader } from "@/components/pwa/pwa-experience-loader";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ServiceWorkerUpdatePrompt } from "@/components/pwa/service-worker-update-prompt";
import { SkipToMain } from "@/components/layout/skip-to-main";
import { IncidentBanner } from "@/components/marketing/incident-banner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { APP_PLANS } from "@/lib/billing/plans";
import {
  SEO_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_DIFFERENTIATORS,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import "./globals.css";
import "./system-glass.css";
import "./modern-ui.css";
import "./site-experience.css";
import "./soft-ui.css";
import "./public-workspace.css";

const siteUrl = getSiteUrl();
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Property management software",
  title: {
    default:
      "Property Management Software in Kenya | EstateDesk",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "Property Management Software in Kenya | EstateDesk",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_KE",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "EstateDesk property management software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Property Management Software in Kenya | EstateDesk",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
  verification: {
    google: googleSiteVerification,
    other: bingSiteVerification
      ? {
          "msvalidate.01": bingSiteVerification,
        }
      : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    legalName: "Afrisilicon Technology Limited",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/icons/icon-512.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${siteUrl}/contact`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: "en-KE",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/vacancies?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Property management software",
    operatingSystem: "Web",
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "en-KE",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    provider: {
      "@id": `${siteUrl}/#organization`,
    },
    featureList: [
      "Tenant and lease management",
      "M-Pesa and multi-bank rent collection",
      "Combined period bills with service-before-rent allocation",
      "Water billing and offline caretaker metering",
      "KRA eTIMS and eRITS-ready tax receipts",
      "Double-entry accounting and AR/AP aging",
      "WhatsApp Business billing chatbot",
      "Public vacancy SEO listings",
      "Maintenance SLAs and inspections",
      "Role-based staff and caretaker access",
      "Owner distributions and tribunal pack export",
      "PWA install and free Web Push alerts",
      ...SITE_DIFFERENTIATORS,
    ],
    keywords: SEO_KEYWORDS.join(", "),
    offers: Object.entries(APP_PLANS).filter(([key]) => key !== "ENTERPRISE").map(([, plan]) => ({
      "@type": "Offer",
      name: `${SITE_NAME} ${plan.name}`,
      category: "SaaS",
      price: plan.monthlyAmount,
      priceCurrency: "KES",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.monthlyAmount,
        priceCurrency: "KES",
        unitText: "MONTH",
      },
      url: `${siteUrl}${plan.href}`,
      availability: "https://schema.org/InStock",
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteUrl}/#primary-navigation`,
    name: "EstateDesk primary public pages",
    itemListElement: [
      { "@type": "SiteNavigationElement", position: 1, name: "Services", url: `${siteUrl}/services` },
      { "@type": "SiteNavigationElement", position: 2, name: "Pricing", url: `${siteUrl}/pricing` },
      { "@type": "SiteNavigationElement", position: 3, name: "Vacancies", url: `${siteUrl}/vacancies` },
      { "@type": "SiteNavigationElement", position: 4, name: "FAQ", url: `${siteUrl}/faq` },
      { "@type": "SiteNavigationElement", position: 5, name: "Contact", url: `${siteUrl}/contact` },
    ],
  },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className="antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Parser-blocking first-party script applies the saved theme before paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script id="estatedesk-theme-init" src="/theme-init.js" />
        <script
          id="estatedesk-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(structuredData) }}
        />
      </head>
      <body className="estate-glass-system ed-mobile-first min-h-dvh bg-background antialiased">
        <PwaLaunchScreen />
        <SkipToMain />
        <ThemeProvider>
          <MarketingAnalytics />
          <WebVitalsReporter />
          <MobileSwipeBack />
          <SiteExperience />
          <ServiceWorkerRegistration />
          <ServiceWorkerUpdatePrompt />
          <PwaExperienceLoader />
          <PwaInstallPrompt />
          <div id="main-content" tabIndex={-1} className="ed-mobile-first-root min-h-dvh w-full min-w-0">
            <Suspense fallback={null}><IncidentBanner /></Suspense>
            {children}
          </div>
          <ScheduledUpdateBanner />
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
