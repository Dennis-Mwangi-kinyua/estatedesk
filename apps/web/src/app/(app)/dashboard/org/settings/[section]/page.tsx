import { notFound } from "next/navigation";
import {
  SETTINGS_NAV_ITEMS,
  SettingsSectionPage,
  type SettingsSectionId,
} from "../settings-sections";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return SETTINGS_NAV_ITEMS.map((item) => ({
    section: item.id,
  }));
}

export default async function SettingsSectionRoute({ params }: PageProps) {
  const { section } = await params;
  const isKnownSection = SETTINGS_NAV_ITEMS.some((item) => item.id === section);

  if (!isKnownSection) {
    notFound();
  }

  return <SettingsSectionPage sectionId={section as SettingsSectionId} />;
}
