"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { getCaretakerSearchHref } from "../_lib/paths.client";

export function CaretakerSearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(getCaretakerSearchHref(query));
  }

  return (
    <form onSubmit={handleSubmit} className={`relative min-w-0 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search units, tenants, issues…"
        className="h-11 w-full min-w-[180px] rounded-2xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/30 sm:min-w-[240px]"
        aria-label="Search caretaker workspace"
      />
    </form>
  );
}