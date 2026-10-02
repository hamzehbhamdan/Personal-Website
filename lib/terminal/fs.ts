import { education, personalInfo, projects } from "@/lib/data"
import { playgroundProjects } from "@/lib/playground"
import { blogPosts } from "@/lib/blog"

/**
 * A tiny read-only virtual filesystem for the site terminal.
 * Built from the same data modules the site renders, so it never drifts.
 * Nothing here touches a real filesystem.
 */

export const HOME = "/home/hamzeh"

export type FileNode = { kind: "file"; text: string; href?: string; hidden?: boolean }
export type DirNode = { kind: "dir"; children: Record<string, TNode>; href?: string; hidden?: boolean }
export type TNode = FileNode | DirNode

const file = (text: string, href?: string, hidden = false): FileNode => ({ kind: "file", text, href, hidden })
const dir = (children: Record<string, TNode>, href?: string, hidden = false): DirNode => ({
    kind: "dir",
    children,
    href,
    hidden,
})

function buildFs(): DirNode {
    const projectFiles: Record<string, TNode> = {}
    for (const p of projects) {
        projectFiles[`${p.slug}.md`] = file(
            `# ${p.title}\n${p.type}\n\n${p.description}\n\ntags: ${p.tags.join(", ")}`,
            `/projects/${p.slug}`
        )
    }

    const blogFiles: Record<string, TNode> = {}
    for (const post of blogPosts) {
        blogFiles[`${post.slug}.md`] = file(
            `# ${post.title}\n${post.date} · ${post.readTime}\n\n${post.excerpt}`,
            `/blog/${post.slug}`
        )
    }

    const playgroundFiles: Record<string, TNode> = {}
    for (const p of playgroundProjects) {
        playgroundFiles[`${p.slug}.md`] = file(
            `# ${p.title}\n${p.tags.join(" · ")}\n\n${p.description}`,
            p.url
        )
    }

    return dir({
        home: dir({
            hamzeh: dir(
                {
                    "README.md": file(
                        "welcome to hamzehhamdan.com\n\nthis site is also a (read-only) filesystem.\ntry: ls, cd projects, cat about.txt, tree, open thesis\n\nanything highlighted is clickable."
                    ),
                    "about.txt": file(personalInfo.bio),
                    "resume.pdf": file("(binary file)\ntry: open resume.pdf", personalInfo.resume),
                    projects: dir(projectFiles, "/projects"),
                    thesis: dir(
                        {
                            "README.md": file(
                                `# ${education.thesis.title}\n\n${education.thesis.description}\n\nopen the interactive version: open thesis`,
                                "/thesis"
                            ),
                        },
                        "/thesis"
                    ),
                    blog: dir(blogFiles, "/blog"),
                    playground: dir(playgroundFiles, "/playground"),
                    consulting: dir(
                        {
                            "README.md": file(
                                "AI consulting: personal training, corporate adoption, and custom AI builds.\n\nopen consulting",
                                "/consulting"
                            ),
                        },
                        "/consulting"
                    ),
                    contact: dir(
                        {
                            "email.txt": file(personalInfo.email, `mailto:${personalInfo.email}`),
                            "linkedin.txt": file(personalInfo.linkedin, personalInfo.linkedin),
                            "github.txt": file(personalInfo.github, personalInfo.github),
                        },
                        "/contact"
                    ),
                    ".plan": file("ship useful things.\nteach people to use them.\nrepeat.", undefined, true),
                    ".secret": file(
                        "nothing here.\n\n...unless you try: sudo hire hamzeh",
                        undefined,
                        true
                    ),
                },
                "/"
            ),
        }),
        etc: dir({
            motd: file("welcome. you are a guest. please do not feed the cache."),
            passwd: file(
                "root:x:0:0:root:/root:/bin/sh\nhamzeh:x:1000:1000:Hamzeh Hamdan:/home/hamzeh:/bin/hh-sh\nvisitor:x:1001:1001:you:/home/hamzeh:/bin/hh-sh"
            ),
        }),
    })
}

export const ROOT: DirNode = buildFs()

/** Resolve `input` against `cwd` into an absolute path. Handles ~, ., .. and absolute paths. */
export function resolvePath(cwd: string, input: string): string {
    let p = input
    if (p === "~" || p.startsWith("~/")) p = HOME + p.slice(1)
    const parts = (p.startsWith("/") ? p : `${cwd}/${p}`).split("/")
    const out: string[] = []
    for (const part of parts) {
        if (!part || part === ".") continue
        if (part === "..") out.pop()
        else out.push(part)
    }
    return "/" + out.join("/")
}

export function lookup(abs: string): TNode | undefined {
    let node: TNode = ROOT
    for (const seg of abs.split("/").filter(Boolean)) {
        if (node.kind !== "dir") return undefined
        // own-property check so names like "__proto__" or "constructor" never resolve
        if (!Object.prototype.hasOwnProperty.call(node.children, seg)) return undefined
        node = node.children[seg]
    }
    return node
}

export function promptPath(cwd: string): string {
    if (cwd === HOME) return "~"
    if (cwd.startsWith(HOME + "/")) return "~" + cwd.slice(HOME.length)
    return cwd
}

/** Entries of a directory: directories first, then files, each alphabetical. */
export function listDir(node: DirNode, showHidden: boolean): [string, TNode][] {
    return Object.entries(node.children)
        .filter(([name, child]) => showHidden || !(child.hidden || name.startsWith(".")))
        .sort(([an, a], [bn, b]) => {
            if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1
            return an.localeCompare(bn)
        })
}
