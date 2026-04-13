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
  { label: "Dashboard", href: "/dashboard/tenant", icon: HiOutlineHome },
  { label: "Profile", href: "/dashboard/tenant/profile", icon: HiOutlineUser },
  { label: "Lease", href: "/dashboard/tenant/lease", icon: HiOutlineDocumentText },
  { label: "Payments", href: "/dashboard/tenant/payments", icon: HiOutlineCreditCard },
  { label: "Invoices", href: "/dashboard/tenant/invoice", icon: HiOutlineReceiptRefund },
  { label: "Water Bills", href: "/dashboard/tenant/water-bills", icon: HiOutlineClipboardDocumentList },
  { label: "Issues", href: "/dashboard/tenant/issues", icon: HiOutlineWrenchScrewdriver },
  { label: "Maintenance", href: "/dashboard/tenant/maintenance", icon: HiOutlineWrenchScrewdriver },
  { label: "Inspections", href: "/dashboard/tenant/inspections", icon: HiOutlineCalendarDays },
  { label: "Notices", href: "/dashboard/tenant/notices", icon: HiOutlineBell },
  { label: "Documents", href: "/dashboard/tenant/documents", icon: HiOutlineFolder },
];