import type { Metadata } from "next";
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
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-background">
        <div className="min-h-screen w-full">{children}</div>
      </body>
    </html>
  );
}
