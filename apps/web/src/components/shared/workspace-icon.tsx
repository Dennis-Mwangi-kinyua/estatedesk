import {
  Activity, Archive, ArchiveRestore, BadgeDollarSign, BadgePercent, BedDouble,
  BellRing, BookOpen, BookOpenCheck, Braces, Building, Building2,
  CalendarDays, ChartNoAxesCombined, CircleCheck, CircleHelp, CirclePlus, ClipboardCheck,
  ClipboardList, Clock3, ContactRound, DoorOpen, Download, Droplets,
  FileCheck2, Files, Gauge, Globe, Handshake, HeartHandshake,
  House, Inbox, KeyRound, Landmark, LayoutDashboard, LifeBuoy,
  LogIn, LogOut, Mail, MapPinned, Megaphone, MessageSquareText,
  Package, PencilLine, Phone, ReceiptText, Ruler, Save,
  Search, ShieldCheck, ShieldUser, SlidersHorizontal, Trash2,
  Upload, UserRound, UserRoundCog, UserRoundPlus, UsersRound, Vault,
  Wallet, WalletCards, Wrench, type LucideIcon,
} from "lucide-react";
import { stickerFor, type WorkspaceIconName } from "../../lib/presentation/stickers";

export const WORKSPACE_ICONS = {
  Activity, Archive, ArchiveRestore, BadgeDollarSign, BadgePercent, BedDouble,
  BellRing, BookOpen, BookOpenCheck, Braces, Building, Building2,
  CalendarDays, ChartNoAxesCombined, CircleCheck, CircleHelp, CirclePlus, ClipboardCheck,
  ClipboardList, Clock3, ContactRound, DoorOpen, Download, Droplets,
  FileCheck2, Files, Gauge, Globe, Handshake, HeartHandshake,
  House, Inbox, KeyRound, Landmark, LayoutDashboard, LifeBuoy,
  LogIn, LogOut, Mail, MapPinned, Megaphone, MessageSquareText,
  Package, PencilLine, Phone, ReceiptText, Ruler, Save,
  Search, ShieldCheck, ShieldUser, SlidersHorizontal, Trash2,
  Upload, UserRound, UserRoundCog, UserRoundPlus, UsersRound, Vault,
  Wallet, WalletCards, Wrench,
} satisfies Record<WorkspaceIconName, LucideIcon>;

export function workspaceIconFor(label: string) {
  return WORKSPACE_ICONS[stickerFor(label).icon];
}

/** Decorative SVG; visible text on its parent supplies the accessible name. */
export function WorkspaceIcon({ label, className = "h-5 w-5" }: { label: string; className?: string }) {
  const { icon } = stickerFor(label);
  const Icon = WORKSPACE_ICONS[icon];
  return <Icon aria-hidden="true" focusable="false" data-workspace-icon={icon} className={`shrink-0 ${className}`} strokeWidth={1.75} />;
}
