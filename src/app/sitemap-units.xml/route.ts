import { prisma } from '@/lib/prisma'
import { APP_URL, XML_HEADERS, buildUrlEntry, formatDate, wrapUrlset } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  const units = await prisma.unit.findMany({
    where: {
      status: 'VACANT',
      isActive: true,
      deletedAt: null,
      property: {
        isActive: true,
        deletedAt: null,
        org: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 50_000,
  })

  const urls = units
    .map((unit) =>
      buildUrlEntry({
        loc: `${APP_URL}/vacancies/${unit.id}`,
        lastmod: formatDate(unit.updatedAt),
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
