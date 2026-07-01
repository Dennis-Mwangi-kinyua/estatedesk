import { gzipSync } from 'node:zlib'
import { getSiteUrl } from './seo'

export const APP_URL = getSiteUrl()

export const PUBLIC_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap-vacancies.xml',
  '/sitemap-rental-landings.xml',
] as const

export const XML_HEADERS = {
  'Content-Type': 'application/xml',
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
}

export const GZIP_HEADERS = {
  'Content-Type': 'application/x-gzip',
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
}

export function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatDate(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

export function buildUrlEntry({
  loc,
  lastmod,
  changefreq,
  priority,
}: {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  const changefreqTag = changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''
  const priorityTag = priority ? `\n    <priority>${priority}</priority>` : ''

  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}${changefreqTag}${priorityTag}\n  </url>`
}

export function wrapUrlset(urls: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
}

export function buildSitemapIndexEntry(loc: string, lastmod?: string) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n  </sitemap>`
}

export function wrapSitemapIndex(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>`
}

export function gzipXml(xml: string) {
  return gzipSync(Buffer.from(xml, 'utf8'))
}
