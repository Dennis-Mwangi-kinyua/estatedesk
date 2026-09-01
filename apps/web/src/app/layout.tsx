import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { MarketingAnalytics } from "@/components/marketing/marketing-analytics";
import { WebVitalsReporter } from "@/components/monitoring/web-vitals-reporter";
import { MobileSwipeBack } from "@/components/navigation/mobile-swipe-back";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { PwaLaunchScreen } from "@/components/pwa/pwa-launch-screen";
import { PwaExperience } from "@/components/pwa/pwa-experience";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ServiceWorkerUpdatePrompt } from "@/components/pwa/service-worker-update-prompt";
import { InlineScript } from "@/components/layout/inline-script";
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
import {
  THEME_COOKIE_NAME,
  THEME_INIT_SCRIPT,
  getServerResolvedTheme,
} from "@/lib/theme/preference";
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
    default:
      "EstateDesk | Best Property Management Software in Kenya (M-Pesa, KRA eTIMS)",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SEO_KEYWORDS],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "EstateDesk | Best Property Management Software in Kenya (M-Pesa, KRA eTIMS)",
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
    title:
      "EstateDesk | Best Property Management Software in Kenya (M-Pesa, KRA eTIMS)",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const serverResolvedTheme = getServerResolvedTheme(
    cookieStore.get(THEME_COOKIE_NAME)?.value,
  );
  const htmlClassName = ["antialiased", serverResolvedTheme]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang="en"
      className={htmlClassName}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <InlineScript id="estatedesk-theme-init" html={THEME_INIT_SCRIPT} />
        <InlineScript
          id="estatedesk-pwa-launch-init"
          html={`(function(){try{var standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;if(standalone){document.documentElement.dataset.pwaLaunch="visible";document.documentElement.dataset.pwaLaunchStartedAt=String(performance.now());var dark=window.matchMedia("(prefers-color-scheme: dark)").matches;var color=dark?"#020617":"#f8fafc";document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color)})}}catch(e){}})();`}
        />
        <InlineScript
          id="estatedesk-structured-data"
          scriptType="application/ld+json"
          html={JSON.stringify(structuredData)}
        />
      </head>
      <body className="ed-mobile-first min-h-dvh bg-background antialiased">
        <PwaLaunchScreen />
        <SkipToMain />
        <ThemeProvider>
          <MarketingAnalytics />
          <WebVitalsReporter />
          <MobileSwipeBack />
          <ServiceWorkerRegistration />
          <ServiceWorkerUpdatePrompt />
          <PwaExperience />
          <PwaInstallPrompt />
          <div id="main-content" className="ed-mobile-first-root min-h-dvh w-full min-w-0">
            <IncidentBanner />
            {children}
          </div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
