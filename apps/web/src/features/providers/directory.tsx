import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "./service";
import { SERVICE_CATEGORIES } from "./policy";
import { panelClass, inputClass } from "./forms";
import { ProfileAvatar } from "@/components/uploads/profile-avatar";
import { ProfilePictureProvider } from "@/components/uploads/profile-picture-context";

export type DirectoryParams = { category?: string; location?: string; page?: string };
const PAGE_SIZE = 18;

function pageHref(category: string | undefined, location: string, page: number, orgView: boolean) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (location) params.set("location", location);
  if (page > 1) params.set("page", String(page));
  return `${orgView ? "/dashboard/org/service-providers" : "/service-providers"}${params.size ? `?${params.toString()}` : ""}`;
}

export async function ProviderDirectory({ filters, orgView = false }: { filters: DirectoryParams; orgView?: boolean }) {
  const location = typeof filters.location === "string" ? filters.location.trim().slice(0, 160) : "";
  const category = SERVICE_CATEGORIES.find(value => value === filters.category);
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const where = { ...visibleProviderWhere, ...(category ? { category } : {}), ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}) };
  const total = await prisma.serviceProvider.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const providers = await prisma.serviceProvider.findMany({
    where,
    include: {
      user: { select: { profileImageUrl: true } },
      _count: { select: { portfolio: true, reviews: true, jobs: { where: { status: "COMPLETED" } } } },
    },
    orderBy: [{ available: "desc" }, { reviewedAt: "desc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const ratings = providers.length ? await prisma.providerReview.groupBy({
    by: ["providerId"],
    where: { providerId: { in: providers.map(provider => provider.id) } },
    _avg: { rating: true },
  }) : [];
  const ratingMap = new Map(ratings.map(rating => [rating.providerId, rating._avg.rating]));

  return (
    <div className="space-y-5">
      <form className={`${panelClass} grid gap-4 sm:grid-cols-[1fr_1fr_auto]`}>
        <label className="text-sm font-medium">Service category<select name="category" defaultValue={category ?? ""} className={inputClass}><option value="">All services</option>{SERVICE_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-medium">Location or area<input name="location" defaultValue={location} placeholder="e.g. Nairobi or Westlands" className={inputClass} maxLength={160} /></label>
        <button className="min-h-11 self-end rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground">Search providers</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{total} approved {total === 1 ? "provider" : "providers"}{category ? ` · ${category}` : ""}{location ? ` · ${location}` : ""}</p>{total > 0 ? <p className="text-xs text-muted-foreground">Page {currentPage} of {pageCount}</p> : null}</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map(provider => {
          const average = ratingMap.get(provider.id);
          return (
            <ProfilePictureProvider key={provider.id} url={provider.user.profileImageUrl}>
              <article className={`${panelClass} flex h-full flex-col gap-4 transition-shadow hover:shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary"><ProfileAvatar name={provider.businessName} /></div>
                  <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{provider.category}</p><h2 className="mt-0.5 min-w-0 text-lg font-bold"><Link href={`/service-providers/${provider.id}`} className="inline-flex min-h-11 max-w-full items-center hover:underline"><span className="truncate">{provider.businessName}</span></Link></h2></div>
                </div>
                <p className="text-sm text-muted-foreground">Serving {provider.location}</p>
                <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6">{provider.bio}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {provider.reviewedAt ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300">Profile reviewed</span> : null}
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${provider.available ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-muted text-muted-foreground"}`}>{provider.available ? "Available" : "Not taking work"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-border py-3 text-center"><div><p className="font-bold">{average ? `${average.toFixed(1)} / 5` : "New"}</p><p className="text-[11px] text-muted-foreground">{provider._count.reviews} reviews</p></div><div><p className="font-bold">{provider._count.jobs}</p><p className="text-[11px] text-muted-foreground">completed jobs</p></div><div><p className="font-bold">{provider._count.portfolio}</p><p className="text-[11px] text-muted-foreground">projects</p></div></div>
                <Link className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted" href={`/service-providers/${provider.id}`}>{orgView ? "Review profile & send offer" : "View profile & portfolio"}<span aria-hidden="true" className="ml-2">→</span></Link>
              </article>
            </ProfilePictureProvider>
          );
        })}
      </div>
      {!providers.length ? <div className={`${panelClass} py-12 text-center`}><h2 className="text-lg font-semibold">No approved providers match these filters</h2><p className="mt-2 text-sm text-muted-foreground">Try a broader service area or choose a different category.</p></div> : null}
      {pageCount > 1 ? <nav aria-label="Provider directory pages" className="flex items-center justify-center gap-3"><Link aria-disabled={currentPage === 1} className={`inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold ${currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={pageHref(category, location, Math.max(1, currentPage - 1), orgView)}>Previous</Link><span className="text-sm text-muted-foreground">{currentPage} / {pageCount}</span><Link aria-disabled={currentPage === pageCount} className={`inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold ${currentPage === pageCount ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={pageHref(category, location, Math.min(pageCount, currentPage + 1), orgView)}>Next</Link></nav> : null}
      <p className="text-xs text-muted-foreground">Reviews are posted only after organisations confirm completed work. “Profile reviewed” means the EstateDesk team has reviewed the provider application; it does not guarantee workmanship or identity-document verification.</p>
    </div>
  );
}
