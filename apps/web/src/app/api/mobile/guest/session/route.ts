import { nativeGuestLogin, nativeGuestSession } from "@/lib/mobile/native-guest-stay";

export async function GET(request: Request) { return nativeGuestSession(request); }
export async function POST(request: Request) { return nativeGuestLogin(request); }
