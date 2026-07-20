import { describe, it, expect } from "vitest"
import sitemap from "@/app/sitemap"
import { projects } from "@/lib/data"
import { blogPosts } from "@/lib/blog"
import { blogPosts as consultingBlogPosts } from "@/lib/consulting-blog"

const APEX = "https://hamzehhamdan.com"

describe("sitemap", () => {
    const urls = sitemap().map((e) => e.url)

    it("lists the blog, playground, and consulting-blog index pages", () => {
        expect(urls).toContain(`${APEX}/blog`)
        expect(urls).toContain(`${APEX}/playground`)
        expect(urls).toContain(`${APEX}/consulting/blog`)
    })

    it("lists every blog post URL", () => {
        expect(blogPosts.length).toBeGreaterThan(0)
        for (const post of blogPosts) {
            expect(urls).toContain(`${APEX}/blog/${post.slug}`)
        }
    })

    it("lists every consulting-blog post URL", () => {
        expect(consultingBlogPosts.length).toBeGreaterThan(0)
        for (const post of consultingBlogPosts) {
            expect(urls).toContain(`${APEX}/consulting/blog/${post.slug}`)
        }
    })

    it("keeps the pre-existing static and project pages", () => {
        expect(urls).toContain(APEX)
        expect(urls).toContain(`${APEX}/projects`)
        expect(urls).toContain(`${APEX}/contact`)
        expect(urls).toContain(`${APEX}/consulting`)
        expect(urls).toContain(`${APEX}/thesis`)
        for (const project of projects) {
            expect(urls).toContain(`${APEX}/projects/${project.slug}`)
        }
    })

    it("uses only the apex host, has no duplicates, and omits the /about redirect", () => {
        for (const url of urls) {
            expect(url.startsWith(APEX)).toBe(true)
            expect(url).not.toContain("www.")
        }
        expect(new Set(urls).size).toBe(urls.length)
        // app/(public)/about/page.tsx is redirect("/") — a sitemap must not list redirecting URLs.
        expect(urls).not.toContain(`${APEX}/about`)
        // 8 static pages + one URL per project, blog post, and consulting-blog post.
        expect(urls.length).toBe(
            8 + projects.length + blogPosts.length + consultingBlogPosts.length
        )
    })
})
