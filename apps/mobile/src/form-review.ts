import type {NativeActionField} from "@estatedesk/contracts/mobile";
export function nativeFieldReview(field:NativeActionField,value:string):string{
 if(field.type==="photo")return value?"One new photo selected":"No new photo";
 if(field.type==="organization")return field.options?.find(o=>o.value===value)?.label??(value?"Organization selected":"No linked organization");
 if(field.type==="properties")return `${(JSON.parse(value||"[]") as string[]).length} properties selected`;
 if(field.type==="multiselect")return (JSON.parse(value||"[]") as string[]).map(v=>field.options?.find(o=>o.value===v)?.label??"Selected option").join(", ")||"None";
 if(field.type==="signature")return `${(JSON.parse(value||'{"signatureMethod":"TYPED"}') as {signatureMethod:string}).signatureMethod.toLowerCase()} signature`;
 if(field.type==="password")return value?"••••••••":"—";
 if(field.type==="checkbox")return value==="on"?"Yes":"No";
 if(field.type==="datetime"&&value&&!value.startsWith("draft-date:"))return new Date(value).toLocaleString("en-KE",{timeZone:"Africa/Nairobi"})+" EAT";
 return field.options?.find(o=>o.value===value)?.label??(value||"—");
}
