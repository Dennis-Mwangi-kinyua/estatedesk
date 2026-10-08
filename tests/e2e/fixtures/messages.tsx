import { createRoot } from "react-dom/client";
import PlatformMessagesPage from "../../../apps/web/src/app/(app)/platform/messages/page";
void PlatformMessagesPage({ searchParams: Promise.resolve({}) }).then(page => createRoot(document.getElementById("fixture")!).render(page));
