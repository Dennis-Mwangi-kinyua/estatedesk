import type { Metadata } from "next";
// src/app/print/layout.tsx

import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata;

export default function PrintLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
