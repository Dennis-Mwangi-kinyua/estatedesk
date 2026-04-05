import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

type MemberFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: StaffRole;
  };
  submitLabel?: string;
  lockedRole?: StaffRole;
};

export function MemberForm({
  action,
  defaultValues,
  submitLabel = "Save Member",
  lockedRole,
}: MemberFormProps) {
  const selectedRole = lockedRole ?? defaultValues?.role ?? "TENANT";

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Full Name
        </label>
        <input
          name="fullName"
          defaultValue={defaultValues?.fullName ?? ""}
          required
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Email
        </label>
        <input
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Phone
        </label>
        <input
          name="phone"
          defaultValue={defaultValues?.phone ?? ""}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      {lockedRole ? (
        <>
          <input type="hidden" name="role" value={lockedRole} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">
              Role
            </label>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
              {lockedRole}
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">
            Role
          </label>
          <select
            name="role"
            defaultValue={selectedRole}
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      )}

      <button className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800">
        {submitLabel}
      </button>
    </form>
  );
}