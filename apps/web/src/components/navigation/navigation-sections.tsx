import { Fragment, type ReactNode } from "react";
import { groupNavigation, type NavigationItem, type NavigationSection } from "@/lib/navigation/workspace-navigation";

type Props<T extends NavigationItem> = {
  items: readonly T[];
  sections: readonly NavigationSection[];
  renderItem: (item: T) => ReactNode;
};

export function NavigationSections<T extends NavigationItem>({ items, sections, renderItem }: Props<T>) {
  return groupNavigation(items, sections).map(group => (
    <section key={group.label} aria-label={group.label} className="space-y-1 pb-2">
      <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
      {group.items.map(item => <Fragment key={item.href}>{renderItem(item)}</Fragment>)}
    </section>
  ));
}
