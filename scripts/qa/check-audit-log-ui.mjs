import { build } from "esbuild";
import { chromium } from "playwright";

const fixture = `import {createRoot} from 'react-dom/client'; import {MobileLogList,DesktopTable} from './apps/web/src/app/(app)/platform/audit-logs/_components/audit-logs-lists'; const log={id:'audit-ui-test',createdAt:new Date('2026-10-21T09:00:00Z'),action:'TENANT_UPDATED',entityType:'Tenant',entityId:'tenant-test',requestId:'request-test',ip:'203.0.113.42',userAgent:'Test browser',metadata:{pathname:'/dashboard/org/tenants/example',passwordHash:'must-not-be-visible'},beforeState:{status:'ACTIVE'},afterState:{status:'INACTIVE'},actor:{id:'actor-test',fullName:'Test Administrator',email:'admin@example.test',platformRole:'PLATFORM_ADMIN'},org:{id:'org-test',name:'Test Organization',slug:'test',status:'ACTIVE'}};createRoot(document.getElementById('root')).render(<><MobileLogList logs={[log]}/><DesktopTable logs={[log]}/></>);`;
const bundle = await build({
  stdin: { contents: fixture, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "presentation-only", setup(builder) {
    builder.onResolve({ filter: /_lib\/helpers$/ }, () => ({ path: "formatters", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: 'export const formatDateTime=x=>x.toISOString();export const formatLabel=x=>x;export const formatAuditGeo=()=>"Not captured";', loader: "js" }));
  } }],
});
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent('<style>.hidden{display:none}@media(min-width:768px){.md\\:hidden{display:none}.md\\:block{display:block}}pre{white-space:pre-wrap;overflow-wrap:anywhere}dd,p{overflow-wrap:anywhere}</style><div id="root"></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const entry = page.locator("details:visible");
    await entry.locator("summary").waitFor();
    if (await entry.getAttribute("open") !== null) throw Error("Starts expanded");
    await entry.locator("summary").click();
    if (await entry.getAttribute("open") === null) throw Error("Did not expand");
    const text = await entry.innerText();
    if (!text.includes("request-test") || !text.includes("Before") || !text.includes("INACTIVE") || text.includes("must-not-be-visible")) throw Error("Incorrect troubleshooting detail");
    const href = await entry.getByRole("link", { name: "Download full log (JSON)" }).getAttribute("href");
    if (href !== "/platform/audit-logs/audit-ui-test/download") throw Error("Incorrect download destination");
    await entry.locator("summary").press("Enter");
    if (await entry.getAttribute("open") !== null) throw Error("Keyboard collapse failed");
    await page.close();
    process.stdout.write(`Audit expansion, details, redaction, download link, and keyboard checks passed at ${width}px\n`);
  }
} finally {
  await browser.close();
}
