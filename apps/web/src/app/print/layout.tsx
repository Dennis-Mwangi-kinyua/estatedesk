// src/app/print/layout.tsx

import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

export default function PrintLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
