import { createRoot } from "react-dom/client";
import { ProfilePictureForm } from "../../../apps/web/src/components/uploads/profile-picture-form";
import { ProfilePictureProvider } from "../../../apps/web/src/components/uploads/profile-picture-context";
import { WorkspaceIdentity } from "../../../apps/web/src/components/shared/workspace-identity";
const url = "https://imagedelivery.net/test/profile/public";
createRoot(document.getElementById("fixture")!).render(<ProfilePictureProvider url={url}><WorkspaceIdentity name="Jane Example" role="Tenant" /><ProfilePictureForm name="Jane Example" url={url} /></ProfilePictureProvider>);
