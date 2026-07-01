import { authPageMetadata } from "@/lib/seo";

export const metadata = authPageMetadata;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
