import { createOrgIssueAction } from "@/features/issues/actions/create-org-issue-action";
import { panelShellClassName } from "./issues-ui";

export type IssueNewPropertyOption = {
  id: string;
  name: string;
  units: {
    id: string;
    houseNo: string;
    building: { name: string } | null;
  }[];
};

type IssueNewFormProps = {
  properties: IssueNewPropertyOption[];
  sharedTitle: string;
  sharedDescription: string;
  selectedPropertyId: string;
  selectedUnitId: string;
  isSharedDraft: boolean;
  errorMessage: string | null;
};

export function IssueNewForm({
  properties,
  sharedTitle,
  sharedDescription,
  selectedPropertyId,
  selectedUnitId,
  isSharedDraft,
  errorMessage,
}: IssueNewFormProps) {
  const unitsForSelectedProperty =
    properties.find((property) => property.id === selectedPropertyId)?.units ?? [];

  return (
    <div className="space-y-5">
      {isSharedDraft ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Shared content was added to this issue draft. Review the title and
          description before submitting.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <form
        action={createOrgIssueAction}
        className={`${panelShellClassName} space-y-5 p-5 sm:p-6`}
      >
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Issue title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={3}
            defaultValue={sharedTitle}
            placeholder="e.g. Broken water heater"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={5}
            rows={6}
            defaultValue={sharedDescription}
            placeholder="Describe the issue, location details, and urgency..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="propertyId" className="text-sm font-medium">
              Property
            </label>
            <select
              id="propertyId"
              name="propertyId"
              defaultValue={selectedPropertyId}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select property (optional)</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="unitId" className="text-sm font-medium">
              Unit
            </label>
            <select
              id="unitId"
              name="unitId"
              defaultValue={selectedUnitId}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select unit (optional)</option>
              {unitsForSelectedProperty.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.houseNo}
                  {unit.building?.name ? ` • ${unit.building.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="MEDIUM"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Office reviewers are notified when a new issue is submitted.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Submit issue
          </button>
        </div>
      </form>
    </div>
  );
}