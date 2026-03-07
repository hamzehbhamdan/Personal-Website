import { MetadataRoute } from "next"
import { projects } from "@/lib/data"

const siteUrl = "https://www.hamzehhamdan.com"

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages = [
        { url: siteUrl, priority: 1.0, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/projects`, priority: 0.9, changeFrequency: "weekly" as const },
        { url: `${siteUrl}/contact`, priority: 0.7, changeFrequency: "yearly" as const },
        { url: `${siteUrl}/consulting`, priority: 0.8, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/thesis`, priority: 0.8, changeFrequency: "monthly" as const },
    ]

    const projectPages = projects.map((project) => ({
        url: `${siteUrl}/projects/${project.slug}`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
    }))

    return [...staticPages, ...projectPages].map((page) => ({
        url: page.url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }))
}
