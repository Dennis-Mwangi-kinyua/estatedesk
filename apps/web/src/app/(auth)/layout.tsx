import { authPageMetadata } from "@/lib/seo";

export const metadata = authPageMetadata;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="modern-auth ed-mobile-first ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden">
      {children}
    </div>
  );
}
