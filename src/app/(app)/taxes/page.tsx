import { redirect } from "next/navigation";

export default function TaxesRedirectPage() {
  redirect("/dashboard/org/taxes");
}