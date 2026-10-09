"use client";

import { VisualSticker } from "@/components/shared/visual-sticker";
import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
export function WizardHeader({ orgName }: { orgName: string; helpOrgRole: OrgRole }) {
  return <header className="border-b border-border p-5 sm:p-6"><Link href="/dashboard/org/properties" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5"/>Property directory</Link><p className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">{orgName} · Property setup</p><h1 className="mt-2 text-3xl font-semibold tracking-tight"><VisualSticker label="property" className="mr-3" />Add a property</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Start with the whole site. Add its owner, billing defaults, and the individual spaces you want to rent out.</p></header>;
}
