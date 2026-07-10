import { getStatusClasses } from "../_lib/helpers";
import type { TaxesPageData } from "../_lib/types";

export function TaxesProfilesPanel({
  taxpayerProfiles,
}: Pick<TaxesPageData, "taxpayerProfiles">) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-semibold">Taxpayer Profiles</h2>
      </div>

      {taxpayerProfiles.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No taxpayer profiles found.
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {taxpayerProfiles.slice(0, 6).map((profile) => (
            <div key={profile.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.kraPin} · {profile.kind} · {profile.org.name}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                      profile.isActive ? "ACTIVE" : "DISABLED",
                    )}`}
                  >
                    {profile.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getStatusClasses(
                      profile.isResident ? "ACKNOWLEDGED" : "MANUAL_REVIEW",
                    )}`}
                  >
                    {profile.isResident ? "RESIDENT" : "NON-RESIDENT"}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Email: {profile.email ?? "—"}</p>
                <p>Phone: {profile.phone ?? "—"}</p>
                <p>Properties Linked: {profile.properties.length}</p>
                <p>
                  Residential Properties:{" "}
                  {
                    profile.properties.filter(
                      (property) => property.type === "RESIDENTIAL",
                    ).length
                  }
                </p>
              </div>

              {profile.properties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.properties.slice(0, 5).map((property) => (
                    <span
                      key={property.id}
                      className="inline-flex rounded-full border px-2.5 py-1 text-xs"
                    >
                      {property.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}