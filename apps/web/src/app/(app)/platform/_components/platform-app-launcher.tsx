import Link from "@/components/navigation/workspace-link";
import { PlatformNavIcon } from "./platform-nav-icon";

const apps = [
  { label: "Organizations", href: "/platform/organizations", tone: "sky" },
  { label: "Users", href: "/platform/users", tone: "violet" },
  { label: "Onboarding", href: "/platform/onboarding", tone: "emerald" },
  { label: "Agreements", href: "/platform/agreements", tone: "amber" },
  { label: "Payments", href: "/platform/payments", tone: "emerald" },
  { label: "Billing center", href: "/platform/billing", tone: "sky" },
  { label: "Subscriptions", href: "/platform/subscriptions", tone: "violet" },
  { label: "Reports", href: "/platform/reports", tone: "amber" },
  { label: "Messages", href: "/platform/messages", tone: "sky" },
  { label: "Search platform", href: "/platform/search", tone: "violet" },
  { label: "Developer portal", href: "/platform/developer", tone: "slate" },
  { label: "Add organization", href: "/platform/organizations/new", tone: "emerald" },
] as const;

export function PlatformAppLauncher() {
  return (
    <nav aria-label="Platform apps" className="platform-app-launcher mt-7">
      {apps.map(app => (
        <Link key={app.href} href={app.href} prefetch={false} className="platform-app-link group">
          <span className="platform-app-icon" data-app-tone={app.tone}>
            <PlatformNavIcon label={app.href} className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>
          <span className="platform-app-label">{app.label}</span>
        </Link>
      ))}
    </nav>
  );
}
