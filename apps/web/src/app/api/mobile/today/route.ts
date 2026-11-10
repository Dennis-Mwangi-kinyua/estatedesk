import { nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { getTodaySummary } from "@/features/today/service";

export async function GET(request: Request) {
  return nativeRoute(request, async session => mobileJson(await getTodaySummary(session)));
}
