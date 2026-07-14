import { PwaLoadingCard } from "@/components/pwa/pwa-launch-screen";

export default function AppRouteLoading() {
  return (
    <div
      className="app-route-loading"
      role="status"
      aria-live="polite"
      aria-label="EstateDesk is loading your workspace"
    >
      <PwaLoadingCard />
      <span className="sr-only">Loading your EstateDesk workspace</span>
    </div>
  );
}
