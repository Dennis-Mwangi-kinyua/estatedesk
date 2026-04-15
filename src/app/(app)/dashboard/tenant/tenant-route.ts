export function isTenantRouteActive(pathname: string, href: string) {
  if (href === "/dashboard/tenant") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}