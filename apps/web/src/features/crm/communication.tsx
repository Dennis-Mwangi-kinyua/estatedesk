import { randomUUID } from "node:crypto";
import { CrmForm } from "./form";
import { sendCrmMessage } from "./actions";
import { Panel, Field, inputClass } from "./ui";
export function CommunicationPanel({ target, targetId, email, phone, name }: { target: string; targetId: string; email: string | null; phone: string | null; name: string }) {
  return <Panel>
    <h2 className="text-lg font-semibold">Customer communication</h2>
    <p className="mt-1 text-sm text-muted-foreground">Send a personal service message to{" "}{name}. Messages are recorded in the activity history.</p>
    <div className="my-4 flex gap-4 text-sm">
      {phone && <a className="underline" href={`tel:${phone}`}>Call{" "}{phone}
      </a>}
      {email && <a className="underline" href={`mailto:${email}`}>Open email app</a>}
    </div>
    <CrmForm action={sendCrmMessage} submit="Send message" className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="target" value={target} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="requestKey" value={randomUUID()} />
      <Field title="Channel">
        <select name="channel" className={inputClass}>
          <option value="EMAIL">Email ·{" "}{email ?? "address required"}
          </option>
          {target === "tenant" && <option value="IN_APP">Customer portal</option>}
        </select>
      </Field>
      <Field title="Subject"><input name="subject" required maxLength={160} className={inputClass} /></Field>
      <div className="sm:col-span-2"><Field title="Message"><textarea name="body" required maxLength={4000} rows={5} className={inputClass} /></Field></div>
    </CrmForm>
  </Panel>;
}
