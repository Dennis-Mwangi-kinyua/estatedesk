export function accountLoginUrl() {
  return new URL("/login", process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://estatedesk.co.ke").toString();
}
