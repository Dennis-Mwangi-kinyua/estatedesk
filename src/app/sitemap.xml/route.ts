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
  const protectedPublicPages = ['/login', '/register']

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

  for (const loc of protectedPublicPages) {
    const pageFile = path.join(ROOT, 'src', 'app', '(auth)', loc.slice(1), 'page.tsx')
    const lastmod = fileExists(pageFile) ? fs.statSync(pageFile).mtime.toISOString().slice(0, 10) : undefined
    entries.push({ loc, lastmod })
  }

  const urls = entries
    .map((e) =>
      buildUrlEntry({
        loc: `${APP_URL}${e.loc}`,
        lastmod: e.lastmod,
        changefreq: e.loc === '/' ? 'daily' : 'weekly',
        priority: e.loc === '/' ? '1.0' : protectedPublicPages.includes(e.loc) ? '0.8' : '0.6',
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
