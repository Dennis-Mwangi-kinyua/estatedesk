import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type MoveOutsPageProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function MoveOutsPage({ searchParams }: MoveOutsPageProps) {
  const resolved = (await searchParams) ?? {};
  const page = resolved.page;

  redirect(
    page ? `/dashboard/org/move-outs?page=${page}` : "/dashboard/org/move-outs",
  );
}