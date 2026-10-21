import { PwaLoadingCard } from "@/components/pwa/pwa-launch-screen";

// Cover the authenticated layout's session and organization lookups too.
export default function Loading() {
  return (
    <div className="app-route-loading" role="status" aria-live="polite" aria-label="EstateDesk is loading your workspace">
      <PwaLoadingCard />
    </div>
  );
}
