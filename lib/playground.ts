
export interface PlaygroundProject {
    slug: string;
    title: string;
    description: string;
    tags: string[];
    url: string; // path to the static HTML file
    date: string;
    blogSlug?: string; // optional link to a blog post explaining the project
}

export const playgroundProjects: PlaygroundProject[] = [
    {
        slug: "fourier-drawing-machine",
        title: "Fourier Drawing Machine",
        description:
            "Upload any image and watch spinning circles reconstruct it using Fourier series decomposition. Visualizes how any shape can be approximated by a sum of rotating epicycles.",
        tags: ["Math", "Visualization", "Signal Processing"],
        url: "/playground/fourier-drawing-machine/index.html",
        date: "2025",
        blogSlug: "fourier-drawing-machine",
    },
    // {
    //     slug: "mcp-injection-lab",
    //     title: "MCP Injection Lab",
    //     description:
    //         "28 realistic-looking web pages — blog posts, product reviews, job listings, API docs, RSS feeds — each containing hidden prompt injection payloads. Send your AI agent to browse them and see if it gets manipulated.",
    //     tags: ["Security", "AI", "Research"],
    //     url: "/playground/mcp-injection-lab/index.html",
    //     date: "2025",
    //     blogSlug: "mcp-injection-lab",
    // },
];
