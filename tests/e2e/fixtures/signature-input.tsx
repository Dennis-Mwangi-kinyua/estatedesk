import { createRoot } from "react-dom/client";
import { SignatureInput } from "../../../apps/web/src/components/signatures/signature-input";

createRoot(document.getElementById("fixture")!).render(<form onSubmit={event => { if (event.defaultPrevented) return; event.preventDefault(); const data = new FormData(event.currentTarget); document.getElementById("result")!.textContent = JSON.stringify(Object.fromEntries(data)); }}><SignatureInput defaultName="Test Signer" /><button type="submit">Save signature</button></form>);
