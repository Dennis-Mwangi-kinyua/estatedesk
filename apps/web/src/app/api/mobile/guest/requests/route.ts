import { nativeGuestRequest } from "@/lib/mobile/native-guest-stay";

export async function POST(request: Request) { return nativeGuestRequest(request); }
