import { NewOrganizationWorkspace } from "./_components/new-org-workspace";
import { createOrganizationAction } from "./actions";

export default function NewOrganizationPage() {
  return (
    <NewOrganizationWorkspace createOrganizationAction={createOrganizationAction} />
  );
}
