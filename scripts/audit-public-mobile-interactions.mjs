/** Read-only keyboard navigation and enlarged root-font checks; never submits forms. */
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const base=process.env.AUDIT_BASE_URL || 'https://estatedesk.co.ke';
const output=process.env.AUDIT_OUTPUT_DIR || '/tmp/estatedesk-public-mobile';
const {mkdir}=await import('node:fs/promises'); await mkdir(output,{recursive:true});
const browser=await chromium.launch(); const results=[];
try {for(const width of [360,390,768]) {
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 for(const path of ['/', '/service-providers/register','/vacancies','/contact']) {
 const page=await context.newPage(); const response=await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded',timeout:45000}); await page.locator('h1').first().waitFor(); await page.waitForTimeout(2500);
 const result={path,width,status:response.status(),layout:await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,inputs:[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(e=>e.getClientRects().length).map(e=>({name:e.name,fontSize:getComputedStyle(e).fontSize,height:e.getBoundingClientRect().height}))}))};
 const toggle=page.getByRole('button',{name:'Open menu',exact:true});
 if(await toggle.isVisible().catch(()=>false)) {try {await toggle.click({timeout:15000}); const dialog=page.getByRole('dialog',{name:'Site navigation'}); await dialog.waitFor(); await page.waitForTimeout(100); result.initialFocus=await dialog.evaluate(e=>e.contains(document.activeElement)); result.focusTrapped=true; for(let i=0;i<18;i++){await page.keyboard.press('Tab');if(!await dialog.evaluate(e=>e.contains(document.activeElement)))result.focusTrapped=false;} await page.keyboard.press('Escape'); result.escapeCloses=await dialog.isHidden(); result.focusRestored=await toggle.evaluate(e=>e===document.activeElement);}catch(e){result.menuError=e.message;}}
 await page.addStyleTag({content:'html {font-size: 200% !important}'}); result.text200Overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(width===390)await page.screenshot({path:output+'/' +(path==='/'?'home-200':path.slice(1).replaceAll('/','-')+'-200')+'.png',fullPage:true});
 results.push(result); console.log(JSON.stringify(result)); await page.close();
 }await context.close();
}}finally{await browser.close();await writeFile(output+'/extra.json',JSON.stringify(results,null,2));}
