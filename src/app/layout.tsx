import type { Metadata, Viewport } from "next";
import { MarketingAnalytics } from "@/components/marketing/marketing-analytics";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { MobileSwipeBack } from "@/components/navigation/mobile-swipe-back";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ServiceWorkerUpdatePrompt } from "@/components/pwa/service-worker-update-prompt";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { APP_PLANS } from "@/lib/billing/plans";
import { SEO_KEYWORDS, SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";
import "./globals.css";

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
    default: "EstateDesk | Property Management Software in Kenya",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EstateDesk | Property Management Software in Kenya",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_KE",
    images: [
      {
        url: "/images/og-vacancy.svg",
        width: 1200,
        height: 630,
        alt: "EstateDesk property management software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EstateDesk | Property Management Software in Kenya",
    description: SITE_DESCRIPTION,
    images: ["/images/og-vacancy.svg"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
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
  viewportFit: "cover",
  themeColor: "#0f766e",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    legalName: SITE_NAME,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/images/og-vacancy.svg`,
      width: 1200,
      height: 630,
    },
    image: `${siteUrl}/images/og-vacancy.svg`,
    areaServed: ["KE", "UG", "TZ", "RW", "AE"],
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
      "Tenant management",
      "Lease management",
      "Rent tracking",
      "Water billing",
      "Maintenance issue tracking",
      "Property inspections",
      "Vacancy publishing",
      "Staff permissions",
      "Operational reports",
    ],
    areaServed: [
      { "@type": "Country", name: "Kenya" },
      { "@type": "Country", name: "Uganda" },
      { "@type": "Country", name: "Tanzania" },
      { "@type": "Country", name: "Rwanda" },
      { "@type": "Country", name: "United Arab Emirates" },
    ],
    offers: Object.values(APP_PLANS).map((plan) => ({
      "@type": "Offer",
      name: `${SITE_NAME} ${plan.name}`,
      category: "SaaS",
      price: plan.monthlyAmount,
      priceCurrency: "KES",
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

export default function RootLayout({
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
        <ThemeInitScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <MarketingAnalytics />
          <WebVitalsReporter />
          <MobileSwipeBack />
          <ServiceWorkerRegistration />
          <ServiceWorkerUpdatePrompt />
          <PwaInstallPrompt />
          <div className="min-h-screen w-full">{children}</div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
