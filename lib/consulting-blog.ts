
export type ContentBlock =
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "list"; heading?: string; items: string[] }
    | { type: "callout"; text: string }
    | { type: "diagram"; id: string }

export interface BlogPost {
    slug: string
    title: string
    date: string
    readTime: string
    topics: string[]
    platforms: string[]
    excerpt: string
    content: ContentBlock[]
}

// Posts removed for now; add new entries here to repopulate the consulting blog.
export const blogPosts: BlogPost[] = []

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug)
}
