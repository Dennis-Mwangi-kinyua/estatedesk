/** Read-only mobile layout verification. Never submits forms. */
import { chromium } from 'playwright';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
const base = process.env.AUDIT_BASE_URL || 'https://estatedesk.co.ke';
const output = process.env.AUDIT_OUTPUT_DIR || '/tmp/estatedesk-public-mobile';
await mkdir(output, { recursive: true });
const entries = await readdir('apps/web/src/app/(marketing)', { withFileTypes: true });
const paths = ['/', '/login', '/register', '/forgot-password', '/service-providers/register'];
for (const entry of entries.filter(e => e.isDirectory())) {
  try { await readdir(`apps/web/src/app/(marketing)/${entry.name}`); const { access } = await import('node:fs/promises'); await access(`apps/web/src/app/(marketing)/${entry.name}/page.tsx`); paths.push(`/${entry.name}`); } catch {}
}
paths.push('/guides/manage-kenyan-rentals-from-uae');
const browser = await chromium.launch();
const results = [];
try {
 await Promise.all([360, 390, 768].map(async (width) => {
  const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  for (const path of paths) {
   const page = await context.newPage();
   const errors = [];
   page.on('pageerror', e => errors.push(e.message));
   try {
    const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.locator('h1').first().waitFor({timeout:15000});
    await page.waitForTimeout(1200);
    const layout = await page.evaluate(() => {
     const visible = e => { const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none'; };
     const label = e => (e.getAttribute('aria-label') || e.innerText || e.getAttribute('name') || e.tagName).trim().slice(0,100);
     const targets = [...document.querySelectorAll('a,button,input:not([type=hidden]),select,textarea,summary')].filter(visible);
     return { overflow: document.documentElement.scrollWidth > innerWidth + 1, viewport: document.querySelector('meta[name=viewport]')?.content, h1: document.querySelector('h1')?.innerText,
      offscreenControls: targets.filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right>innerWidth+1;}).map(label),
      smallTargets: targets.filter(e=>{const r=e.getBoundingClientRect();return r.width<24 || r.height<24;}).map(e=>({label:label(e),width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)})),
      smallTextInputs: targets.filter(e=>e.matches('input:not([type=checkbox]):not([type=radio]),select,textarea') && parseFloat(getComputedStyle(e).fontSize)<16).map(label),
      unnamedControls: targets.filter(e=>e.matches('button,input:not([type=submit]),select,textarea') && !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.innerText?.trim()).map(label) };
    });
    let menu = 'absent';
    const toggle = page.getByRole('button', {name:'Open menu',exact:true});
    if (await toggle.count() && await toggle.isVisible()) {
     await toggle.click();
     const dialog = page.getByRole('dialog',{name:'Site navigation'});
     await dialog.waitFor({state:'visible'});
     const bounds = await dialog.boundingBox();
     const inBounds = bounds.x>=0 && bounds.x+bounds.width<=width+1 && bounds.y+bounds.height<=844+1;
     await page.keyboard.press('Escape');
     menu = inBounds && await dialog.isHidden() ? 'pass' : 'fail';
    }
    const result={path,width,status:response?.status(),...layout,menu,errors}; results.push(result);
    if(width===390 && ['/', '/pricing','/contact','/property-management-software-middle-east','/vacancies','/service-providers/register'].includes(path)) await page.screenshot({path:`${output}/${path==='/'?'home':path.slice(1).replaceAll('/','-')}.png`,fullPage:true});
    console.log(JSON.stringify(result));
   } catch(e) { results.push({path,width,error:e.message}); console.log(`ERROR ${width} ${path}: ${e.message}`); }
   await page.close();
  }
  await context.close();
 }));
} finally { await browser.close(); }
await writeFile(`${output}/report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),method:'Chromium touch emulation; 360/390/768 x 844; default theme; read-only; 24px target candidates require spacing/inline exception review; inputs below 16px are iOS zoom risk candidates. No real iOS, screen reader, contrast certification, or authenticated coverage.',results},null,2));
