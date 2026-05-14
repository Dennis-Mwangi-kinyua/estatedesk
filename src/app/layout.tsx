import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
          <div className="min-h-screen w-full">{children}</div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
