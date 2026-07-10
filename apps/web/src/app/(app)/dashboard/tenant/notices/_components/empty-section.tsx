import { InAppGuideLink } from "@/components/help/in-app-guide-link";

export function EmptySection({
  title,
  description,
  guideTopic,
}: {
  title: string;
  description: string;
  guideTopic?: "moveOut" | "rent";
}) {
  return (
    <div className="ed-theme-muted-panel rounded-[20px] p-4 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {guideTopic ? (
        <div className="mt-3">
          <InAppGuideLink topic={guideTopic} workspace="tenant" />
        </div>
      ) : null}
    </div>
  );
}