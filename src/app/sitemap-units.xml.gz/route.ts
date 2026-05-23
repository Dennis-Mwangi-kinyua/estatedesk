import { gzipXml, GZIP_HEADERS } from '@/lib/sitemap-utils'
import { renderSitemapXml } from '../sitemap-units.xml/route'

export async function GET() {
  const bucket = process.env.S3_BUCKET_NAME || process.env.S3_BUCKET
  if (bucket) {
    const url = `https://${bucket}.s3.amazonaws.com/sitemap-units.xml.gz`
    return Response.redirect(url, 302)
  }

  const xml = await renderSitemapXml()
  return new Response(gzipXml(xml), {
    headers: GZIP_HEADERS,
  })
}
