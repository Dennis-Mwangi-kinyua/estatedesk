import Link from "next/link";

export function ReceiptAction({ href }: { href: string | null }) {
  if (!href) {
    return (
      <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
        No receipt available
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
    >
      Download Receipt
    </Link>
  );
}