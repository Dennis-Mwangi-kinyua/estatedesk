"use client";

import Link from "next/link";
import { memo } from "react";
import { PencilLine } from "lucide-react";

export const MobileEditBar = memo(function MobileEditBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Link
          href="/dashboard/tenant/profile/edit"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-neutral-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition active:scale-[0.99]"
        >
          <PencilLine className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>
    </div>
  );
});