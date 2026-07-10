import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { CalendarWorkspace } from "./_components/calendar-workspace";
import { getCaretakerCalendarData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ week?: string }>;
};

export default async function CaretakerCalendarPage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};

  const data = await getCaretakerCalendarData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    week: resolved.week,
  });

  return <CalendarWorkspace data={data} />;
}