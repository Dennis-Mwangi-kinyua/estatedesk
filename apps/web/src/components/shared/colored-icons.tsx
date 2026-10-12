import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";
import type { WorkspaceIconName } from "@/lib/presentation/stickers";
import { workspaceIconArtwork } from "./workspace-icon-artwork";

/** Compatible with existing icon props, sizing, accessible labels, and refs. */
function createColoredIcon(name: WorkspaceIconName) {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function ColoredIcon({ size = 24, className = "", children, strokeWidth = 1.75, ...props }, ref) {
    return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} className={`workspace-color-icon ${className}`} data-workspace-icon={name}>
      <g dangerouslySetInnerHTML={{ __html: workspaceIconArtwork[name] }} />
      {children}
    </svg>;
  });
  Icon.displayName = `Colored${name}`;
  return Icon;
}

export const Activity = createColoredIcon("Activity");
export const Archive = createColoredIcon("Archive");
export const ArchiveRestore = createColoredIcon("ArchiveRestore");
export const BadgeDollarSign = createColoredIcon("BadgeDollarSign");
export const BadgePercent = createColoredIcon("BadgePercent");
export const BedDouble = createColoredIcon("BedDouble");
export const BellRing = createColoredIcon("BellRing");
export const BookOpen = createColoredIcon("BookOpen");
export const BookOpenCheck = createColoredIcon("BookOpenCheck");
export const Braces = createColoredIcon("Braces");
export const Building = createColoredIcon("Building");
export const Building2 = createColoredIcon("Building2");
export const CalendarDays = createColoredIcon("CalendarDays");
export const ChartNoAxesCombined = createColoredIcon("ChartNoAxesCombined");
export const CircleCheck = createColoredIcon("CircleCheck");
export const CircleHelp = createColoredIcon("CircleHelp");
export const CirclePlus = createColoredIcon("CirclePlus");
export const ClipboardCheck = createColoredIcon("ClipboardCheck");
export const ClipboardList = createColoredIcon("ClipboardList");
export const Clock3 = createColoredIcon("Clock3");
export const ContactRound = createColoredIcon("ContactRound");
export const DoorOpen = createColoredIcon("DoorOpen");
export const Download = createColoredIcon("Download");
export const Droplets = createColoredIcon("Droplets");
export const FileCheck2 = createColoredIcon("FileCheck2");
export const Files = createColoredIcon("Files");
export const Gauge = createColoredIcon("Gauge");
export const Globe = createColoredIcon("Globe");
export const Handshake = createColoredIcon("Handshake");
export const HeartHandshake = createColoredIcon("HeartHandshake");
export const House = createColoredIcon("House");
export const Inbox = createColoredIcon("Inbox");
export const KeyRound = createColoredIcon("KeyRound");
export const Landmark = createColoredIcon("Landmark");
export const LayoutDashboard = createColoredIcon("LayoutDashboard");
export const LifeBuoy = createColoredIcon("LifeBuoy");
export const LogIn = createColoredIcon("LogIn");
export const LogOut = createColoredIcon("LogOut");
export const Mail = createColoredIcon("Mail");
export const MapPinned = createColoredIcon("MapPinned");
export const Megaphone = createColoredIcon("Megaphone");
export const MessageSquareText = createColoredIcon("MessageSquareText");
export const Package = createColoredIcon("Package");
export const PencilLine = createColoredIcon("PencilLine");
export const Phone = createColoredIcon("Phone");
export const ReceiptText = createColoredIcon("ReceiptText");
export const Ruler = createColoredIcon("Ruler");
export const Save = createColoredIcon("Save");
export const Search = createColoredIcon("Search");
export const ShieldCheck = createColoredIcon("ShieldCheck");
export const ShieldUser = createColoredIcon("ShieldUser");
export const SlidersHorizontal = createColoredIcon("SlidersHorizontal");
export const Trash2 = createColoredIcon("Trash2");
export const Upload = createColoredIcon("Upload");
export const UserRound = createColoredIcon("UserRound");
export const UserRoundCog = createColoredIcon("UserRoundCog");
export const UserRoundPlus = createColoredIcon("UserRoundPlus");
export const UsersRound = createColoredIcon("UsersRound");
export const Vault = createColoredIcon("Vault");
export const Wallet = createColoredIcon("Wallet");
export const WalletCards = createColoredIcon("WalletCards");
export const Wrench = createColoredIcon("Wrench");
