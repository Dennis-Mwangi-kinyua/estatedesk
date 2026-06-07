import { prisma } from '@/lib/prisma'
import { APP_URL, XML_HEADERS, buildUrlEntry, formatDate, wrapUrlset } from '@/lib/sitemap-utils'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function categorySlug(type: string) {
  switch (type) {
    case 'BEDSITTER':
      return 'bedsitters'
    case 'STUDIO':
      return 'studios'
    case 'SINGLE_ROOM':
      return 'single-rooms'
    case 'APARTMENT':
      return 'apartments'
    case 'SHOP':
      return 'shops'
    case 'OFFICE':
      return 'offices'
    case 'STALL':
      return 'stalls'
    case 'WAREHOUSE':
      return 'warehouses'
    case 'GODOWN':
      return 'godowns'
    default:
      return slugify(type)
  }
}

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
      type: true,
      updatedAt: true,
      property: {
        select: {
          location: true,
          address: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50_000,
  })

  const landingPages = new Map<string, string>()

  for (const unit of units) {
    const location = unit.property.location ?? unit.property.address ?? unit.property.name
    const locationSlug = slugify(location)
    const unitCategorySlug = categorySlug(unit.type)

    if (!locationSlug || !unitCategorySlug) continue

    const loc = `/vacancies/${locationSlug}/${unitCategorySlug}`
    const lastmod = formatDate(unit.updatedAt)
    const existingLastmod = landingPages.get(loc)

    if (!existingLastmod || existingLastmod < lastmod) {
      landingPages.set(loc, lastmod)
    }
  }

  const urls = Array.from(landingPages.entries())
    .map(([loc, lastmod]) =>
      buildUrlEntry({
        loc: `${APP_URL}${loc}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.7',
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
