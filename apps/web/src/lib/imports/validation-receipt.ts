import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ImportKind } from "./types";
type Input={orgId:string;actorId:string;kind:ImportKind;csv:string};
function fingerprint(input:Input){return createHash("sha256").update(JSON.stringify([input.orgId,input.actorId,input.kind,input.csv])).digest("hex");}
export function issueImportValidation(input:Input,secret:string,now=Date.now()){
  if(!secret)throw new Error("Import validation signing is unavailable.");
  const payload=Buffer.from(JSON.stringify({hash:fingerprint(input),expires:now+15*60_000})).toString("base64url");
  return `${payload}.${createHmac("sha256",secret).update(payload).digest("hex")}`;
}
export function verifyImportValidation(token:string,input:Input,secret:string,now=Date.now()){
  if(!secret)return false;
  try{const [payload,signature,extra]=token.split(".");if(extra||!payload||!signature||!/^[a-f0-9]{64}$/.test(signature))return false;
    const expected=createHmac("sha256",secret).update(payload).digest();if(!timingSafeEqual(expected,Buffer.from(signature,"hex")))return false;
    const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));return decoded.hash===fingerprint(input)&&Number.isFinite(decoded.expires)&&decoded.expires>now;
  }catch{return false;}
}
