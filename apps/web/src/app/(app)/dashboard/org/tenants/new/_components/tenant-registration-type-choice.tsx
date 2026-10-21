type TenantRegistrationTypeChoiceProps = {
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

const OPTIONS = [
  {
    existing: false,
    title: "New tenant",
    description: "Start a fresh tenancy. The agreed rent and deposit form the first bill.",
  },
  {
    existing: true,
    title: "Onboard existing tenant",
    description: "Add a tenant who already lives here but is new to EstateDesk, and import their historic unpaid rent.",
  },
];

export function TenantRegistrationTypeChoice({
  value,
  disabled,
  onChange,
}: TenantRegistrationTypeChoiceProps) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Tenant registration type">
      {OPTIONS.map((option) => (
        <button
          key={option.title}
          type="button"
          aria-pressed={value === option.existing}
          disabled={disabled}
          onClick={() => onChange(option.existing)}
          className={`rounded-2xl border p-4 text-left ${value === option.existing ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`}
        >
          <span className="block font-semibold">{option.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
