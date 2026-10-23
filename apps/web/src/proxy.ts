import type { NextRequest } from "next/server";
import { proxy as handleRequest } from "../proxy";

/** Next discovers Proxy beside src/app, not beside the workspace package.json. */
export function proxy(request: NextRequest) {
  return handleRequest(request);
}

export const config = {
  matcher: ["/((?!_next/static/|_next/image(?:/|$)|favicon\\.ico$).*)"],
};
