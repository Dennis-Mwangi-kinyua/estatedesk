const stickers: Record<string, string> = {
  dashboard: "🏡", platform: "🏡", overview: "🏡", today: "☀️", search: "🔎",
  organizations: "🏢", properties: "🏘️", units: "🚪", tenants: "👥", users: "👥",
  admins: "🛡️", permissions: "🔐", security: "🛡️", "support-access": "🤝",
  payments: "💸", billing: "💳", subscriptions: "🎟️", expenditures: "🧾",
  "payment-ops": "💱", onboarding: "👋", marketing: "🚀", messages: "💬",
  reports: "📊", broadcasts: "📣", settings: "⚙️", help: "💡", "audit-logs": "📋",
  developer: "🧑‍💻", docs: "📚", control: "🎛️", "system-health": "💚",
  "api-explorer": "🔌", "api-keys": "🔑", "feature-flags": "🚩", jobs: "⚡",
  "rate-limits": "⏱️", "data-management": "🗂️", backups: "☁️", leases: "📝",
  lease: "📝", documents: "📁", issues: "🛠️", maintenance: "🛠️", inspections: "🔍",
  calendar: "📅", "move-outs": "📦", "water-bills": "💧", water: "💧",
  handover: "📒", vendors: "🚚", "finance-requests": "📥", notifications: "🔔",
  profile: "🙂", notices: "📣", accounting: "🧮", staff: "🤝", expenses: "🧾",
  statements: "📈", income: "💰", portfolio: "🏘️", distributions: "💰",
};

/** Decorative emoji; the adjacent navigation label supplies the accessible name. */
export function SidebarSticker({ href }: { href: string }) {
  const [path, hash] = href.split("#");
  const segments = path.split("/").filter(Boolean);
  const key = hash || segments[segments.length - 1];
  const emoji = stickers[key] ?? (segments.length <= 2 ? "🏡" : "📌");
  return <span aria-hidden="true" className="sidebar-sticker" data-tone={Array.from(key ?? "").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3}>{emoji}</span>;
}
