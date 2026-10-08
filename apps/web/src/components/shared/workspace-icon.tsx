import { createElement } from "react";
import {
  Activity, Archive, Bell, BookOpen, Building2, CalendarDays, ChartNoAxesCombined,
  CircleCheck, ClipboardList, CreditCard, DoorOpen, Droplets, FileText,
  Gauge, LayoutDashboard, LifeBuoy, LockKeyhole, Megaphone, MessageSquare,
  Search, Settings2, ShieldCheck, Users, Wrench,
} from "lucide-react";

/** Shared outline icon vocabulary for navigation, headings and metrics. */
export function workspaceIconFor(label: string) {
  const text = label.toLowerCase();
  if (/water|meter|reading/.test(text)) return Droplets;
  if (/issue|maintenance|repair|inspection|task/.test(text)) return Wrench;
  if (/payment|rent|income|revenue|balance|billing|finance|collection|payout|expenditure|expense|tax|budget|accounting/.test(text)) return CreditCard;
  if (/tenant|staff|employee|user|people|member|onboarding|resident|agent|landlord|profile/.test(text)) return Users;
  if (/propert|organisation|organization|portfolio|building/.test(text)) return Building2;
  if (/unit|occupied|vacan|occupancy/.test(text)) return DoorOpen;
  if (/lease|document|invoice|agreement|export/.test(text)) return FileText;
  if (/notification/.test(text)) return Bell;
  if (/message|inbox|whatsapp|sms|email/.test(text)) return MessageSquare;
  if (/notice|broadcast|marketing/.test(text)) return Megaphone;
  if (/security|permission|admin/.test(text)) return ShieldCheck;
  if (/key|password|login|invite/.test(text)) return LockKeyhole;
  if (/setting|integration|api|control|feature/.test(text)) return Settings2;
  if (/calendar|today/.test(text)) return CalendarDays;
  if (/complete|closed|resolved|success|verified/.test(text)) return CircleCheck;
  if (/report|analytic|statement|distribution/.test(text)) return ChartNoAxesCombined;
  if (/health/.test(text)) return Activity;
  if (/limit/.test(text)) return Gauge;
  if (/backup|archive|data-management|move-out/.test(text)) return Archive;
  if (/help|support|contact/.test(text)) return LifeBuoy;
  if (/guide|docs/.test(text)) return BookOpen;
  if (/search/.test(text)) return Search;
  if (/job|queue|pending|audit/.test(text)) return ClipboardList;
  return LayoutDashboard;
}

export function WorkspaceIcon({ label, className = "h-5 w-5" }: { label: string; className?: string }) {
  return createElement(workspaceIconFor(label), { "aria-hidden": true, className, strokeWidth: 1.75 });
}
