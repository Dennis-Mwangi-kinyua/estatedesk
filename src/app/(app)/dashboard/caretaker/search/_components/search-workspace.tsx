import { Search } from "lucide-react";
import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerSearchPageData } from "../_lib/types";
import { SearchHeader } from "./search-header";
import { SearchResults } from "./search-results";

const SEARCH_TIPS = [
  "Unit house number",
  "Tenant name or phone",
  "Issue title",
  "Inspection tenant name",
];

export function SearchWorkspace({
  q,
  data,
}: {
  q: string;
  data: CaretakerSearchPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <SearchHeader />

      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not run search"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <section className={panelShellClassName}>
              <div className={panelBodyClassName}>
                <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-muted/10 px-4 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      id="q"
                      name="q"
                      defaultValue={q}
                      placeholder="House no, tenant, issue, inspection..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <button className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                    Search
                  </button>
                </form>
              </div>
            </section>

            <SearchResults q={q} data={data} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <section className={panelShellClassName}>
              <div className={panelBodyClassName}>
                <p className="text-sm font-semibold text-foreground">
                  Search tips
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {SEARCH_TIPS.map((tip) => (
                    <li
                      key={tip}
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      )}

      <CaretakerWorkspaceFooter note="Search scoped to your assigned units" />
    </div>
  );
}