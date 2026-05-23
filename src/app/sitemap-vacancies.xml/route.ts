import { prisma } from '@/lib/prisma'
import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset, formatDate } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  const units = await prisma.unit.findMany({
    where: { status: 'VACANT', isActive: true, deletedAt: null },
    include: { property: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  })

  const urls = units
    .map((u) =>
      buildUrlEntry({
        loc: `${APP_URL}/vacancies/${u.id}`,
        lastmod: formatDate(u.updatedAt),
        changefreq: 'weekly',
        priority: '0.6',
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
