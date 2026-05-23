export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://www.estatedesk.co.ke'

  const text = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap-index.xml\nSitemap: ${baseUrl}/sitemap-index.xml.gz\nHost: ${baseUrl}\n`

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
