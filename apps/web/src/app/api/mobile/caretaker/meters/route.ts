import { nativeForm } from "@/lib/mobile/form";
import { getCaretakerMeterReadData } from "@/app/(app)/dashboard/caretaker/water-bills/read/_lib/queries";
import { quickSubmitMeterReading } from "@/app/(app)/dashboard/caretaker/water-bills/read/[unitId]/_lib/quick-submit-meter-reading";
import { mobileReadingInputSchema } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const result = await getCaretakerMeterReadData({ orgId: session.activeOrgId!, caretakerUserId: session.userId, membershipScope: session.membershipScope });
    if (!result.ok) return mobileJson({ error: "Unable to load meter readings." }, 503);
    return mobileJson({ period: result.period, units: result.pendingUnits.map(unit => ({ id: unit.id, label: `${unit.propertyName} / ${unit.houseNo}`, previousReading: unit.previousReading })) });
  }, { role: "CARETAKER" });
}

export async function POST(request: Request) {
  return nativeRoute(request, async () => {
    const { input, form } = await nativeForm(request, mobileReadingInputSchema);
    for (const [key, value] of Object.entries(input)) form.set(key, String(value));
    const result = await quickSubmitMeterReading({}, form);
    return result.error ? mobileJson({ error: result.error, fieldErrors: result.fieldErrors }, 400) : mobileJson({ ok: true });
  }, { role: "CARETAKER" });
}
