import {
  HiOutlineBell,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineHome,
  HiOutlineReceiptRefund,
  HiOutlineUser,
  HiOutlineWrenchScrewdriver,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";

export const tenantNavItems = [
  { label: "Dashboard", href: "/dashboard/tenant", icon: HiOutlineHome, emoji: "🏠" },
  { label: "Profile", href: "/dashboard/tenant/profile", icon: HiOutlineUser, emoji: "👤" },
  { label: "Lease", href: "/dashboard/tenant/lease", icon: HiOutlineDocumentText, emoji: "📄" },
  { label: "Payments", href: "/dashboard/tenant/payments", icon: HiOutlineCreditCard, emoji: "💳" },
  { label: "Invoices", href: "/dashboard/tenant/invoice", icon: HiOutlineReceiptRefund, emoji: "🧾" },
  { label: "Water Bills", href: "/dashboard/tenant/water-bills", icon: HiOutlineClipboardDocumentList, emoji: "💧" },
  { label: "Issues", href: "/dashboard/tenant/issues", icon: HiOutlineWrenchScrewdriver, emoji: "🛠️" },
  { label: "Maintenance", href: "/dashboard/tenant/maintenance", icon: HiOutlineWrenchScrewdriver, emoji: "🔧" },
  { label: "Inspections", href: "/dashboard/tenant/inspections", icon: HiOutlineCalendarDays, emoji: "🗓️" },
  { label: "Notices", href: "/dashboard/tenant/notices", icon: HiOutlineBell, emoji: "🔔" },
  { label: "Documents", href: "/dashboard/tenant/documents", icon: HiOutlineFolder, emoji: "📁" },
] as const;