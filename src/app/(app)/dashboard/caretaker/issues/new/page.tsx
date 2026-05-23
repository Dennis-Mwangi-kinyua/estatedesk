// src/app/(app)/dashboard/caretaker/issues/new/page.tsx

import Link from "next/link";

import { createCaretakerIssueAction } from "@/features/issues/actions/create-caretaker-issue-action";

export default function NewCaretakerIssuePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="space-y-2">
        <Link
          href="/dashboard/caretaker/issues"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to issues
        </Link>

        <div>
          <h1 className="text-2xl font-semibold">Report New Issue</h1>
          <p className="text-sm text-muted-foreground">
            Create a maintenance issue for your assigned property or unit.
          </p>
        </div>
      </div>

      <form action={createCaretakerIssueAction} className="space-y-5">
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
            placeholder="e.g. Leaking pipe"
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
            rows={5}
            placeholder="Describe the issue..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Submit Issue
          </button>

          <Link
            href="/dashboard/caretaker/issues"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}