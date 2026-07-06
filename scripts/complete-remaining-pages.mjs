import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function w(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function git(rel) {
  return fs.readFileSync(`/tmp/git-${rel.replace(/[\/\[\]]/g, "_")}`, "utf8");
}

function jsxWrap(imports, name, propsType, propsDestructure, jsxFile, passProps) {
  const jsx = fs.readFileSync(jsxFile, "utf8").trim().replace(/^\(\s*/, "").replace(/\s*$/, "");
  return `${imports}

export type ${propsType} = ${passProps.types};

export function ${name}(props: ${propsType}) {
${propsDestructure}
  return (
${jsx}
  );
}
`;
}

function thinPage(imports, guard, pageFn, args, body, workspaceName, pass) {
  return `${imports}
export const dynamic = "force-dynamic";

export default async function ${pageFn}(${args}) {
${guard}${body}

  return <${workspaceName} ${pass} />;
}
`;
}

// USERS LIST
{
  const g = git("src/app/(app)/platform/users/page.tsx");
  const helpers = g
    .slice(g.indexOf("const ROLE_VALUES"), g.indexOf("export default async function PlatformUsersPage"))
    .replace(/\nfunction /g, "\nexport function ");
  const constPart = helpers.slice(0, helpers.indexOf("export function getInitials"));
  const fnPart = helpers.slice(helpers.indexOf("export function getInitials"));
  w("src/app/(app)/platform/users/_lib/constants.ts", `import { PlatformPermissionType, PlatformRole, UserStatus } from "@prisma/client";\n\nexport ${constPart.trim()}\n`);
  w("src/app/(app)/platform/users/_lib/helpers.ts", `${fnPart}\n`);
  w("src/app/(app)/platform/users/_lib/types.ts", `export type UsersSearchParams = Promise<{ page?: string; pageSize?: string; q?: string; role?: string; status?: string; created?: string; createError?: string; archived?: string }>;\n`);
  const ui = g.slice(g.indexOf("function RoleCard"), g.indexOf("export default")).replace(/\nfunction /g, "\nexport function ");
  w("src/app/(app)/platform/users/_components/users-ui.tsx", `import Link from "next/link";\nimport { PlatformRole } from "@prisma/client";\nimport { createPlatformUserAction } from "../actions";\nimport { PLATFORM_ROLE_META, ROLE_VALUES, PLATFORM_PERMISSION_VALUES } from "../_lib/constants";\nimport { formatPermission } from "../_lib/helpers";\n\n${ui}`);
  const pre = fs.readFileSync("/tmp/split-users/pre.txt", "utf8");
  w(
    "src/app/(app)/platform/users/_lib/queries.ts",
    `import { PlatformRole, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getPagination } from "@/lib/db/pagination";
import { buildWhere, parseRole, parseStatus } from "./helpers";

export async function getPlatformUsersPageData(searchParams: {
  page?: string;
  pageSize?: string;
  q?: string;
  role?: string;
  status?: string;
}) {
  const params = searchParams;
${pre.replace(/await requirePlatformRole[\s\S]*?redirectTo: "\/dashboard",\s*\}\);\s*/, "").replace(/const params = await searchParams;\s*/, "  ")}
  return { users, totalFiltered, totalUsers, totalAdmins, activeUsers, page, pageSize, q, role, status };
}
`,
  );
  w(
    "src/app/(app)/platform/users/_components/users-workspace.tsx",
    jsxWrap(
      `import Link from "next/link";
import { Crown, Shield, Trash2, User2 } from "lucide-react";
import { Badge, PageHeader, PaginationControls, StatCard, formatDateTime, formatNumber, toneForStatus } from "../../_components/control-plane";
import { PLATFORM_ROLE_META } from "../_lib/constants";
import { CreatePlatformUserPanel, InfoPill, PreviewBlock, RoleCard } from "./users-ui";
import type { getPlatformUsersPageData } from "../_lib/queries";`,
      "UsersWorkspace",
      "UsersWorkspaceProps",
      "  const { users, totalFiltered, totalUsers, totalAdmins, activeUsers, page, pageSize, q, role, status } = props.data;\n  const params = props.flash;",
      "/tmp/split-users/jsx.txt",
      { types: "{ data: Awaited<ReturnType<typeof getPlatformUsersPageData>>; flash: { created?: string; createError?: string; archived?: string } }" },
    ),
  );
  w(
    "src/app/(app)/platform/users/page.tsx",
    thinPage(
      g.match(/^import[\s\S]*?export const dynamic = "force-dynamic";\n\n/)[0].replace(/export const dynamic = "force-dynamic";\n\n/, ""),
      `import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPlatformUsersPageData } from "./_lib/queries";
import type { UsersSearchParams } from "./_lib/types";
import { UsersWorkspace } from "./_components/users-workspace";

`,
      "PlatformUsersPage",
      "{ searchParams }: { searchParams: UsersSearchParams }",
      `  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const params = await searchParams;
  const data = await getPlatformUsersPageData(params);`,
      "UsersWorkspace",
      'data={data} flash={params}',
    ),
  );
  console.log("users");
}

// BUILDINGS
{
  const g = git("src/app/(app)/buildings/page.tsx");
  w("src/app/(app)/buildings/_lib/helpers.ts", g.slice(g.indexOf("function formatDate"), g.indexOf("type BuildingsPageProps")).replace("function ", "export function "));
  w("src/app/(app)/buildings/_lib/types.ts", `${g.slice(g.indexOf("type BuildingsPageProps"), g.indexOf("export default"))}\n`);
  const pre = fs.readFileSync("/tmp/split-buildings/pre.txt", "utf8");
  w(
    "src/app/(app)/buildings/_lib/queries.ts",
    `import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionWithScope } from "./types";

export async function getBuildingsPageData(session: SessionWithScope, query: string) {
${pre.replace(/const session = await requireManagementAccess\(\);[\s\S]*?resolvedSearchParams = await searchParams;\s*/, "").replace(/const query = resolvedSearchParams\?\.q\?\.trim\(\) \?\? "";\s*/, "  ")}
  return { buildings, totalBuildings, totalUnits, occupiedUnits, vacantUnits, activeBuildings, query };
}
`,
  );
  w(
    "src/app/(app)/buildings/_components/buildings-workspace.tsx",
    jsxWrap(
      `import Link from "next/link";
import { deleteBuildingAction } from "@/app/(app)/dashboard/org/buildings/actions";
import { formatDate } from "../_lib/helpers";
import type { getBuildingsPageData } from "../_lib/queries";`,
      "BuildingsWorkspace",
      "BuildingsWorkspaceProps",
      "  const { buildings, totalBuildings, totalUnits, occupiedUnits, vacantUnits, activeBuildings, query } = props.data;",
      "/tmp/split-buildings/jsx.txt",
      { types: "{ data: Awaited<ReturnType<typeof getBuildingsPageData>> }" },
    ),
  );
  w(
    "src/app/(app)/buildings/page.tsx",
    thinPage(
      `import Link from "next/link";
import { redirect } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { getBuildingsPageData } from "./_lib/queries";
import { BuildingsWorkspace } from "./_components/buildings-workspace";
import type { BuildingsPageProps } from "./_lib/types";

`,
      `  const session = await requireManagementAccess();
  if (!session.activeOrgId) redirect("/dashboard");
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const data = await getBuildingsPageData(session, query);`,
      "BuildingsPage",
      "{ searchParams }: BuildingsPageProps",
      "",
      "BuildingsWorkspace",
      "data={data}",
    ),
  );
  console.log("buildings");
}

console.log("batch done");