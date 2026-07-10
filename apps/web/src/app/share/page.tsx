import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { resolveShareTargetPath } from "@/lib/issues/share-routing";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
};

export default async function ShareTargetPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const session = await getUserSession();

  redirect(
    resolveShareTargetPath({
      role: session?.activeOrgRole,
      isAuthenticated: Boolean(session?.userId),
      shareInput: params,
    }),
  );
}