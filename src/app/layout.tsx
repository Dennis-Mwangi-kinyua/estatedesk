import type { Metadata } from "next";
import { MobileSwipeBack } from "@/components/navigation/mobile-swipe-back";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: "EstateDesk | Property Management Software in Kenya",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "EstateDesk",
    "property management software Kenya",
    "landlord software Kenya",
    "rent management system",
    "tenant management",
    "caretaker management",
    "water billing software",
  ],
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
  },
  twitter: {
    card: "summary_large_image",
    title: "EstateDesk | Property Management Software in Kenya",
    description: SITE_DESCRIPTION,
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
      </head>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <MobileSwipeBack />
          <div className="min-h-screen w-full">{children}</div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
