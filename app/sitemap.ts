import { MetadataRoute } from "next"
import { projects } from "@/lib/data"
import { blogPosts } from "@/lib/blog"
import { blogPosts as consultingBlogPosts } from "@/lib/consulting-blog"

// Static so the route can be emitted by `output: export` (GitHub Pages).
export const dynamic = "force-static"

const siteUrl = "https://hamzehhamdan.com"

export default function sitemap(): MetadataRoute.Sitemap {
    const staticPages = [
        { url: siteUrl, priority: 1.0, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/projects`, priority: 0.9, changeFrequency: "weekly" as const },
        { url: `${siteUrl}/blog`, priority: 0.9, changeFrequency: "weekly" as const },
        { url: `${siteUrl}/consulting`, priority: 0.8, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/consulting/blog`, priority: 0.8, changeFrequency: "weekly" as const },
        { url: `${siteUrl}/thesis`, priority: 0.8, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/playground`, priority: 0.7, changeFrequency: "monthly" as const },
        { url: `${siteUrl}/contact`, priority: 0.7, changeFrequency: "yearly" as const },
    ]

    const projectPages = projects.map((project) => ({
        url: `${siteUrl}/projects/${project.slug}`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
    }))

    const blogPages = blogPosts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
    }))

    const consultingBlogPages = consultingBlogPosts.map((post) => ({
        url: `${siteUrl}/consulting/blog/${post.slug}`,
        priority: 0.7,
        changeFrequency: "monthly" as const,
    }))

    return [...staticPages, ...projectPages, ...blogPages, ...consultingBlogPages].map((page) => ({
        url: page.url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }))
}
