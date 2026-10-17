// This API transports sessions to native secure storage. Browser requests must
// never receive them. These checks supplement session/resource authorization;
// the client header itself is not an authentication credential.
export function isNativeRequest(request: Request) {
  return !request.headers.has("origin") &&
    !request.headers.has("sec-fetch-site") &&
    request.headers.get("x-estatedesk-client") === "native";
}
