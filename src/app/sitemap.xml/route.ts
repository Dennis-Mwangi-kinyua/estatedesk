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

  const rootPage = path.join(ROOT, 'src', 'app', 'page.tsx')
  if (fileExists(rootPage)) {
    const mtime = fs.statSync(rootPage).mtime.toISOString().slice(0, 10)
    entries.push({ loc: '/', lastmod: mtime })
  } else {
    entries.push({ loc: '/' })
  }

  const scanFolders = [path.join(ROOT, 'src', 'app', '(marketing)'), path.join(ROOT, 'src', 'app', '(auth)')]

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

  const authStatic = ['/login', '/register', '/forgot-password', '/verify-email']
  for (const route of authStatic) {
    const name = route.replace(/^\//, '')
    const folder = path.join(ROOT, 'src', 'app', '(auth)', name)
    const pageFile = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].map((f) => path.join(folder, f)).find(fileExists)
    if (pageFile && !entries.find((e) => e.loc === route)) {
      const lastmod = fs.statSync(pageFile).mtime.toISOString().slice(0, 10)
      entries.push({ loc: route, lastmod })
    }
  }

  const urls = entries
    .map((e) =>
      buildUrlEntry({
        loc: `${APP_URL}${e.loc}`,
        lastmod: e.lastmod,
        changefreq: e.loc === '/' ? 'daily' : 'weekly',
        priority: e.loc === '/' ? '1.0' : '0.6',
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
