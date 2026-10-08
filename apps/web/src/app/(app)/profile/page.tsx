import Link from "next/link";
import { ProfilePicturePanel } from "@/components/uploads/profile-picture-panel";
export const dynamic = "force-dynamic";
export default function ProfilePage() {
  return <main className="mx-auto max-w-xl space-y-5 p-6"><Link href="/dashboard" className="text-sm underline">Back to dashboard</Link><h1 className="text-2xl font-semibold">My profile</h1><ProfilePicturePanel /></main>;
}
