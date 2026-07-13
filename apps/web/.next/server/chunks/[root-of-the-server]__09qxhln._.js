module.exports=[814747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},120635,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},463021,(e,t,r)=>{t.exports=e.x("@prisma/client-2c3a283f134fdcb6",()=>require("@prisma/client-2c3a283f134fdcb6"))},522734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},446786,(e,t,r)=>{t.exports=e.x("os",()=>require("os"))},495879,(e,t,r)=>{t.exports=e.x("node:dns",()=>require("node:dns"))},575210,e=>e.a(async(t,r)=>{try{let t=await e.y("@prisma/adapter-pg-994324666b79ccf3");e.n(t),r()}catch(e){r(e)}},!0),666680,(e,t,r)=>{t.exports=e.x("node:crypto",()=>require("node:crypto"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},773508,e=>{"use strict";var t=e.i(463021);class r extends Error{constructor(e){super(e),this.name="ClientSafeError"}}let a=[/prisma/i,/\bP20\d{2}\b/,/invalid `prisma/i,/invocation in/i,/connect ECONNREFUSED/i,/ECONNRESET/i,/ETIMEDOUT/i,/node_modules/i,/NEXT_/,/DATABASE_URL/i,/\/home\/[^/\s]+/i,/at\s+.+\(.+:\d+:\d+\)/,/Unique constraint failed on the fields/i,/Foreign key constraint failed/i];e.s(["ClientSafeError",0,r,"safeClientMessage",0,function(e,s){var i;return e instanceof r?e.message:e instanceof t.Prisma.PrismaClientKnownRequestError||e instanceof t.Prisma.PrismaClientUnknownRequestError||e instanceof t.Prisma.PrismaClientValidationError||e instanceof t.Prisma.PrismaClientInitializationError?s:e instanceof Error?!(i=e.message).trim()||i.length>240||a.some(e=>e.test(i))?s:e.message:s}])},397334,e=>{"use strict";function t(e,t,r){console.error(`[${e}]`,t instanceof Error?{name:t.name,message:t.message,stack:t.stack}:{error:t},r??{})}e.i(773508),e.s(["logServerError",0,t,"safeApiErrorResponse",0,function(e,r,a){return t(e,r),{error:a}}],397334)},790433,e=>e.a(async(t,r)=>{try{var a=e.i(666680),s=e.i(463021),i=e.i(493458),n=e.i(397334),o=e.i(314235),c=t([o]);function d(e,t){for(let r of t){let t=e.get(r);if(t)return t}return null}async function p(){let e,t=await (0,i.headers)();return{ip:(e=t.get("x-forwarded-for"))?e.split(",")[0]?.trim()??null:d(t,["x-real-ip","cf-connecting-ip","x-client-ip"]),userAgent:t.get("user-agent"),requestId:d(t,["x-request-id","x-vercel-id","cf-ray"])??void 0,geo:{country:t.get("x-vercel-ip-country"),region:t.get("x-vercel-ip-country-region"),city:t.get("x-vercel-ip-city"),latitude:t.get("x-vercel-ip-latitude"),longitude:t.get("x-vercel-ip-longitude"),serviceProvider:t.get("x-vercel-ip-asn")??t.get("cf-ipcountry")??null}}}async function u(e){if(e.session.activeOrgId)try{let t=await p();await o.prisma.auditLog.create({data:{orgId:e.session.activeOrgId,actorUserId:e.session.userId,action:"ACCESS_DENIED",entityType:e.entityType??"Route",entityId:e.entityId??"unknown",ip:t.ip,userAgent:t.userAgent,requestId:t.requestId,metadata:{reason:e.reason,required:e.required??[],activeOrgRole:e.session.activeOrgRole,platformRole:e.session.platformRole,geo:t.geo}}})}catch(e){(0,n.logServerError)("audit.deniedAccess",e)}}async function l(e){try{let t=await p();if(!e.orgId){let r=`audit_${a.default.randomUUID().replace(/-/g,"")}`;await o.prisma.$executeRaw(s.Prisma.sql`
          insert into "AuditLog" (
            "id",
            "orgId",
            "actorUserId",
            "action",
            "entityType",
            "entityId",
            "metadata",
            "beforeState",
            "afterState",
            "ip",
            "userAgent",
            "requestId",
            "createdAt"
          )
          values (
            ${r},
            null,
            ${e.actorUserId},
            ${e.action},
            ${e.entityType},
            ${e.entityId},
            ${JSON.stringify({...e.metadata??{},geo:t.geo})}::jsonb,
            ${e.beforeState?JSON.stringify(e.beforeState):null}::jsonb,
            ${e.afterState?JSON.stringify(e.afterState):null}::jsonb,
            ${t.ip},
            ${t.userAgent},
            ${t.requestId},
            now()
          )
        `);return}await o.prisma.auditLog.create({data:{orgId:e.orgId,actorUserId:e.actorUserId,action:e.action,entityType:e.entityType,entityId:e.entityId,ip:t.ip,userAgent:t.userAgent,requestId:t.requestId,metadata:{...e.metadata??{},geo:t.geo},beforeState:e.beforeState??void 0,afterState:e.afterState??void 0}})}catch(t){(0,n.logServerError)("audit.write",t,{action:e.action,entityType:e.entityType,entityId:e.entityId})}}[o]=c.then?(await c)():c,e.s(["auditDeniedAccess",0,u,"writeAuditLog",0,l]),r()}catch(e){r(e)}},!1),124171,e=>e.a(async(t,r)=>{try{var a=e.i(314235),s=t([a]);async function i({key:e,limit:t,windowMs:r}){let s=Date.now(),n=new Date(s+r),[o]=await a.prisma.$queryRaw`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (${e}, 1, ${n}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= CURRENT_TIMESTAMP THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= CURRENT_TIMESTAMP THEN EXCLUDED."resetAt"
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "count", "resetAt"
  `,c=Number(o?.count??0),d=o?.resetAt??n;return c>t?{allowed:!1,retryAfterSeconds:Math.max(1,Math.ceil((d.getTime()-s)/1e3))}:{allowed:!0,retryAfterSeconds:0}}[a]=s.then?(await s)():s,e.s(["checkRateLimit",0,i]),r()}catch(e){r(e)}},!1),626890,e=>{"use strict";function t(e){let t=e.replace(/[^\d+]/g,"");return t.startsWith("+")?t.slice(1):t.startsWith("0")?`254${t.slice(1)}`:t}function r(){let e=process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),t=process.env.WHATSAPP_ACCESS_TOKEN?.trim(),r=process.env.WHATSAPP_GRAPH_VERSION?.trim()||"v20.0";if(!e||!t)throw Error("Missing Meta WhatsApp environment variables: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.");return{accessToken:t,endpoint:`https://graph.facebook.com/${r}/${e}/messages`}}async function a({to:e,body:s}){let i=r(),n=await fetch(i.endpoint,{method:"POST",headers:{Authorization:`Bearer ${i.accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to:t(e),type:"text",text:{preview_url:!0,body:s}})}),o=await n.json().catch(()=>({}));if(!n.ok||o.error)throw Error(o.error?.message??`Meta WhatsApp request failed with status ${n.status}.`);return{provider:"meta-whatsapp",messageId:o.messages?.[0]?.id??null,status:o.messages?.[0]?.message_status??"accepted",waId:o.contacts?.[0]?.wa_id??null}}async function s({to:e,templateName:a,languageCode:i=process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim()||"en",bodyParameters:n}){let o=r(),c=await fetch(o.endpoint,{method:"POST",headers:{Authorization:`Bearer ${o.accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({messaging_product:"whatsapp",recipient_type:"individual",to:t(e),type:"template",template:{name:a,language:{code:i},components:n.length>0?[{type:"body",parameters:n.map(e=>({type:"text",text:e}))}]:void 0}})}),d=await c.json().catch(()=>({}));if(!c.ok||d.error)throw Error(d.error?.message??`Meta WhatsApp template request failed with status ${c.status}.`);return{provider:"meta-whatsapp",templateName:a,messageId:d.messages?.[0]?.id??null,status:d.messages?.[0]?.message_status??"accepted",waId:d.contacts?.[0]?.wa_id??null}}e.s(["sendMetaWhatsappTemplate",0,s,"sendMetaWhatsappText",0,a,"toWhatsappPhone",0,t])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__09qxhln._.js.map