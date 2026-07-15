import { MetadataRoute } from "next"

// Static so the route can be emitted by `output: export` (GitHub Pages).
export const dynamic = "force-static"

const siteUrl = "https://www.hamzehhamdan.com"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard/", "/api/", "/login/"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    }
}
