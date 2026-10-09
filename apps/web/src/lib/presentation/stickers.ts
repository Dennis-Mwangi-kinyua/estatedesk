/** One semantic vocabulary for navigation, cards, headings and form steps. */
export type StickerTone = "sky" | "mint" | "peach" | "violet";
export type WorkspaceIconName =
  | "Activity" | "Archive" | "ArchiveRestore" | "BadgeDollarSign" | "BadgePercent"
  | "BedDouble" | "BellRing" | "BookOpen" | "BookOpenCheck" | "Braces"
  | "Building" | "Building2" | "CalendarDays" | "ChartNoAxesCombined"
  | "CircleCheck" | "CircleHelp" | "CirclePlus" | "ClipboardCheck" | "ClipboardList"
  | "Clock3" | "ContactRound" | "DoorOpen" | "Download" | "Droplets"
  | "FileCheck2" | "Files" | "Gauge" | "Globe" | "Handshake" | "HeartHandshake"
  | "House" | "Inbox" | "KeyRound" | "Landmark" | "LayoutDashboard" | "LifeBuoy"
  | "LogIn" | "LogOut" | "Mail" | "MapPinned" | "Megaphone" | "MessageSquareText"
  | "Package" | "PencilLine" | "Phone" | "ReceiptText" | "Ruler" | "Save"
  | "Search" | "ShieldCheck" | "ShieldUser" | "SlidersHorizontal"
  | "Trash2" | "Upload" | "UserRound" | "UserRoundCog" | "UserRoundPlus"
  | "UsersRound" | "Vault" | "Wallet" | "WalletCards" | "Wrench";
export type Sticker = { icon: WorkspaceIconName; tone: StickerTone };

const vocabulary: Array<[RegExp, WorkspaceIconName, StickerTone]> = [
  [/^(home|overview|dashboard)$|workspace overview/, "House", "sky"],
  [/reports|analytics|insights|statement|distribution|financial report/, "ChartNoAxesCombined", "violet"],
  [/property profile/, "Building2", "sky"],
  [/inspection|verification|verify tenant|review history/, "ClipboardCheck", "violet"],
  [/water|meter|reading/, "Droplets", "sky"],
  [/issue|maintenance|repair|caretaker/, "Wrench", "peach"],
  [/invoice|receipt/, "ReceiptText", "mint"],
  [/accounting|accountant|ledger/, "BookOpenCheck", "mint"],
  [/tax|kra pin/, "Landmark", "mint"],
  [/payout|withdraw/, "Vault", "mint"],
  [/expense|expenditure|budget|spending/, "Wallet", "peach"],
  [/payment|pay rent|billing|collection|rent due/, "WalletCards", "mint"],
  [/finance|income|revenue|balance|monthly rent|pricing|subscription|plan/, "BadgeDollarSign", "mint"],
  [/lease|agreement|tenancy/, "FileCheck2", "sky"],
  [/document|attachment|\bfiles?\b/, "Files", "sky"],
  [/permission|access control|role management/, "KeyRound", "violet"],
  [/super admin|administrator|admin/, "ShieldUser", "violet"],
  [/security|spam|privacy|data consent/, "ShieldCheck", "violet"],
  [/password|credential|key/, "KeyRound", "violet"],
  [/add.*(tenant|staff|user|member)|invite|register|onboard|next steps/, "UserRoundPlus", "mint"],
  [/profile|personal|full name|^name$|identity|national id/, "UserRound", "violet"],
  [/next of kin|relationship|emergency/, "HeartHandshake", "peach"],
  [/tenant|resident|contact person/, "ContactRound", "mint"],
  [/manager|manage.*user|role/, "UserRoundCog", "violet"],
  [/staff|team|employee|user|people|member|agent/, "UsersRound", "violet"],
  [/landlord|owner|partnership|service|handover|vendor/, "Handshake", "violet"],
  [/building|block|commercial/, "Building", "sky"],
  [/godown|warehouse|storage/, "Package", "peach"],
  [/global|other organisations|website/, "Globe", "sky"],
  [/propert|organisation|organization|portfolio|office|company/, "Building2", "sky"],
  [/airbnb|bnb|stay|holiday|bedroom/, "BedDouble", "peach"],
  [/unit|occupied|vacan|occupancy|apartment/, "DoorOpen", "sky"],
  [/notification|alert/, "BellRing", "peach"],
  [/notice|broadcast|marketing|communication preference/, "Megaphone", "peach"],
  [/email|mail|unread/, "Mail", "sky"],
  [/phone|mobile|call/, "Phone", "mint"],
  [/message|whatsapp|sms|conversation/, "MessageSquareText", "sky"],
  [/inbox|no matching/, "Inbox", "sky"],
  [/api|developer|webhook/, "Braces", "violet"],
  [/setting|integration|control|feature|preference/, "SlidersHorizontal", "sky"],
  [/calendar|today|schedule|expired/, "CalendarDays", "peach"],
  [/complete|closed|resolved|success|verified|\bactive\b|status|review/, "CircleCheck", "mint"],
  [/report|analytic|insight|statement|distribution/, "ChartNoAxesCombined", "violet"],
  [/health|monitor/, "Activity", "mint"],
  [/limit|usage|capacity/, "Gauge", "peach"],
  [/backup|restore/, "ArchiveRestore", "sky"],
  [/archive|data.management/, "Archive", "sky"],
  [/move.out|sign.out|log.out|terminated/, "LogOut", "peach"],
  [/log.in|sign.in|login/, "LogIn", "violet"],
  [/help|support|contact/, "LifeBuoy", "mint"],
  [/faq|question/, "CircleHelp", "violet"],
  [/guide|docs|learn|read/, "BookOpen", "violet"],
  [/search|find|match/, "Search", "sky"],
  [/location|address|map/, "MapPinned", "sky"],
  [/reward|discount/, "BadgePercent", "peach"],
  [/job|queue|audit|task|request/, "ClipboardList", "violet"],
  [/pending|recent|waiting|history/, "Clock3", "peach"],
  [/download|export/, "Download", "sky"],
  [/upload|import/, "Upload", "sky"],
  [/save/, "Save", "mint"],
  [/delete|remove/, "Trash2", "peach"],
  [/edit|update/, "PencilLine", "violet"],
  [/add|create|new/, "CirclePlus", "mint"],
  [/layout|dimension|size/, "Ruler", "sky"],
  [/welcome|getting started/, "Handshake", "violet"],
];

/** Match the destination section, never a parent workspace or opaque record ID. */
function semanticLabel(label: string) {
  const text = label.trim().toLowerCase();
  if (!text.startsWith("/")) return text;
  const [path, hash] = text.split("#");
  if (hash) return hash.replaceAll("-", " ");
  const segments = path.split("?")[0].split("/").filter(Boolean);
  const sections: Record<string, string> = {
    tenant: "home", org: "home", platform: "home", caretaker: "home", landlord: "home",
    dashboard: "home", organizations: "organizations", properties: "properties", buildings: "buildings",
    units: "units", tenants: "tenants", staff: "staff", users: "users", admins: "admins",
    payments: "payments", accounting: "accounting", requests: "requests", invoices: "invoices",
    expenditures: "expenditures", finance: "finance", payouts: "payouts", taxes: "taxes",
    leases: "leases", lease: "lease", documents: "documents", profile: "profile",
    inspections: "inspections", issues: "issues", maintenance: "maintenance", tasks: "tasks",
    notifications: "notifications", notices: "notices", messages: "messages", inbox: "inbox",
    security: "security", permissions: "permissions", roles: "roles", settings: "settings",
    integrations: "integrations", api: "api", reports: "reports", analytics: "analytics",
    onboarding: "onboarding", search: "search", help: "help", contact: "contact", faq: "faq",
    docs: "docs", services: "services", pricing: "pricing", subscriptions: "subscriptions",
    billing: "billing", limits: "limits", health: "health", jobs: "jobs", audit: "audit",
    water: "water", airbnb: "airbnb", "move-out": "move-out", "data-management": "data-management",
    handover: "handover", vendors: "vendors",
    "payment-ops": "payments", marketing: "marketing", broadcasts: "broadcasts",
    "support-access": "support", "audit-logs": "audit", control: "control",
    "system-health": "health", "api-explorer": "api", "api-keys": "api", "rate-limits": "limits",
    invoice: "invoice", "water-bills": "water bills", insights: "insights", "verify-tenant": "verify tenant",
    "vacancy-inquiries": "vacancy", "finance-requests": "finance requests", "move-outs": "move out",
    charges: "invoices", imports: "import", "resolution-reports": "reports", support: "support",
    statements: "statements", today: "today", calendar: "calendar", developer: "developer",
    features: "features", "feature-flags": "features", backups: "backups", plans: "plans",
    "change-password": "password", login: "login", register: "register", rewards: "rewards",
  };
  for (const segment of [...segments].reverse()) {
    if (segment === "requests" && segments.includes("accounting")) return "expenses";
    if (sections[segment]) return sections[segment];
  }
  return "dashboard";
}
export function stickerFor(label: string): Sticker {
  const text = semanticLabel(label);
  const match = vocabulary.find(([pattern]) => pattern.test(text));
  return match ? { icon: match[1], tone: match[2] } : { icon: "LayoutDashboard", tone: "sky" };
}
