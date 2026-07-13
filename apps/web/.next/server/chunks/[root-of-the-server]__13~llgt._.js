module.exports=[2579,e=>{"use strict";function t(){return"https://estatedesk.co.ke".replace(/\/$/,"").replace("https://www.estatedesk.co.ke","https://estatedesk.co.ke")}e.s(["SITE_DESCRIPTION",0,"EstateDesk is property management software for landlords and property managers in Kenya, East Africa, Dubai, and global rental markets. Manage tenants, leases, rent, water bills, caretaker field operations, offline meter readings, maintenance SLAs, inspections, vacant houses, WhatsApp tenant contact, and staff access in one secure workspace.","SITE_NAME",0,"EstateDesk","absoluteUrl",0,function(e="/"){let a=e.startsWith("/")?e:`/${e}`;return`${t()}${a}`},"getSiteUrl",0,t])},727028,(e,t,a)=>{t.exports=e.x("node:zlib",()=>require("node:zlib"))},795199,e=>{"use strict";var t=e.i(727028);let a=(0,e.i(2579).getSiteUrl)();function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}e.s(["APP_URL",0,a,"GZIP_HEADERS",0,{"Content-Type":"application/x-gzip","Cache-Control":"s-maxage=3600, stale-while-revalidate=86400"},"PUBLIC_SITEMAP_PATHS",0,["/sitemap.xml","/sitemap-vacancies.xml","/sitemap-vacancy-pages.xml","/sitemap-rental-landings.xml"],"XML_HEADERS",0,{"Content-Type":"application/xml","Cache-Control":"s-maxage=3600, stale-while-revalidate=86400"},"buildSitemapIndexEntry",0,function(e,t){let a=t?`
    <lastmod>${t}</lastmod>`:"";return`  <sitemap>
    <loc>${n(e)}</loc>${a}
  </sitemap>`},"buildUrlEntry",0,function({loc:e,lastmod:t,changefreq:a,priority:r}){let s=t?`
    <lastmod>${t}</lastmod>`:"",i=a?`
    <changefreq>${a}</changefreq>`:"",l=r?`
    <priority>${r}</priority>`:"";return`  <url>
    <loc>${n(e)}</loc>${s}${i}${l}
  </url>`},"formatDate",0,function(e){return new Date(e).toISOString().slice(0,10)},"gzipXml",0,function(e){return(0,t.gzipSync)(Buffer.from(e,"utf8"))},"wrapSitemapIndex",0,function(e){return`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${e.join("\n")}
</sitemapindex>`},"wrapUrlset",0,function(e){return`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${e}
</urlset>`}])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__13~llgt._.js.map