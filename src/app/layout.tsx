import type { Metadata } from "next";
import { MobileSwipeBack } from "@/components/navigation/mobile-swipe-back";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateDesk",
  description: "Property management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <MobileSwipeBack />
          <div className="min-h-screen w-full">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
