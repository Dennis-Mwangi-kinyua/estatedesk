import { connection } from "next/server";
import { authPageMetadata } from "@/lib/seo";

export const metadata = authPageMetadata;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <div className="modern-auth ed-mobile-first ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden">
      {children}
    </div>
  );
}
