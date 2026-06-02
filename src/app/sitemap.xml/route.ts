import fs from 'fs'
import path from 'path'
import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset } from '@/lib/sitemap-utils'

const ROOT = process.cwd()

function fileExists(p: string) {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
}

export async function renderSitemapXml() {
  const entries: { loc: string; lastmod?: string }[] = []
  const priorityByPage: Record<string, string> = {
    '/': '1.0',
    '/faq': '0.95',
    '/property-management-software-kenya': '0.95',
    '/pricing': '0.9',
    '/services': '0.9',
    '/vacancies': '0.9',
    '/landlord-software': '0.85',
    '/rent-tracking-software': '0.85',
    '/water-billing-software': '0.85',
    '/property-management-software-dubai': '0.8',
    '/contact': '0.75',
    '/security': '0.65',
    '/privacy': '0.5',
    '/terms': '0.5',
    '/data-processing': '0.5',
    '/status': '0.5',
  }

  const rootPage = path.join(ROOT, 'src', 'app', 'page.tsx')
  if (fileExists(rootPage)) {
    const mtime = fs.statSync(rootPage).mtime.toISOString().slice(0, 10)
    entries.push({ loc: '/', lastmod: mtime })
  } else {
    entries.push({ loc: '/' })
  }

  const scanFolders = [path.join(ROOT, 'src', 'app', '(marketing)')]

  for (const folder of scanFolders) {
    try {
      const items = fs.readdirSync(folder, { withFileTypes: true })
      for (const it of items) {
        if (!it.isDirectory()) continue
        if (it.name.startsWith('[')) continue

        const pageFileTsx = path.join(folder, it.name, 'page.tsx')
        const pageFileTs = path.join(folder, it.name, 'page.ts')
        const pageFileJsx = path.join(folder, it.name, 'page.jsx')
        const pageFileJs = path.join(folder, it.name, 'page.js')
        const candidate = [pageFileTsx, pageFileTs, pageFileJsx, pageFileJs].find(fileExists)

        if (candidate) {
          const lastmod = fs.statSync(candidate).mtime.toISOString().slice(0, 10)
          entries.push({ loc: `/${it.name}`, lastmod })
        }
      }
    } catch {
      // folder may not exist; ignore
    }
  }

  const urls = entries
    .map((e) =>
      buildUrlEntry({
        loc: `${APP_URL}${e.loc}`,
        lastmod: e.lastmod,
        changefreq: e.loc === '/' ? 'daily' : 'weekly',
        priority: priorityByPage[e.loc] ?? '0.6',
      }),
    )
    .join('\n')

  return wrapUrlset(urls)
}

export async function GET() {
  return new Response(await renderSitemapXml(), {
    headers: XML_HEADERS,
  })
}
