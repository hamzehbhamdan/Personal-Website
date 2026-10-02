
export type ContentBlock =
    | { type: "paragraph"; text: string }
    | { type: "heading"; text: string }
    | { type: "list"; heading?: string; items: string[] }
    | { type: "callout"; text: string }
    | { type: "diagram"; id: string }
    | { type: "formula"; id: "fourier-series" | "dft-coefficients" }
    | { type: "demo"; url: string; title?: string; description?: string; height?: number }

export type Category = "AI" | "Projects" | "Life"

export interface BlogPost {
    slug: string
    title: string
    date: string
    readTime: string
    category: Category
    topics: string[]
    platforms?: string[]
    excerpt: string
    content: ContentBlock[]
}

export const blogPosts: BlogPost[] = [
    // ── Projects ─────────────────────────────────────────────────────────────
    {
        slug: "fourier-drawing-machine",
        title: "Fourier Drawing Machine: How Spinning Circles Can Draw Anything",
        date: "2025",
        readTime: "8 min read",
        category: "Projects",
        topics: ["Math", "Signal Processing", "Visualization"],
        excerpt:
            "Ptolemy was wrong about the planets but right about one thing: any path, however complex, can be drawn by circles within circles. Fourier made it rigorous. The drawing machine makes it visible.",
        content: [
            // ── Intro ─────────────────────────────────────────────────────────
            {
                type: "paragraph",
                text: "In 150 AD, Ptolemy described the motion of planets as circles upon circles — epicycles. He was wrong about the planets. But the mathematical structure he discovered was profound: any closed curve, no matter how irregular, can be described exactly as a sum of circular motions stacked tip-to-tail.",
            },
            {
                type: "paragraph",
                text: "Joseph Fourier made this precise in 1822. For any periodic path through 2D space, you can find a set of rotating vectors — each with its own radius, speed, and starting angle — that sum to trace the path exactly. The Fourier Drawing Machine makes this visible. We'll walk through it in three steps, and you can run each step yourself.",
            },

            // ── Phase 1 ───────────────────────────────────────────────────────
            {
                type: "heading",
                text: "Step 1: Give it something to draw",
            },
            {
                type: "paragraph",
                text: "Upload any image (logos, letters, and silhouettes work best), draw a freehand closed shape, or pick one of the preset samples. Your input gets stored and passed to Step 2 — nothing leaves your browser.",
            },
            {
                type: "demo",
                url: "/playground/fourier-drawing-machine/phase1.html",
                title: "Phase 1 — Input",
                height: 380,
            },

            // ── Bridge to Phase 2 ─────────────────────────────────────────────
            {
                type: "heading",
                text: "Step 2: Find the outline",
            },
            {
                type: "paragraph",
                text: "The Fourier series works on a 1D path — a sequence of (x, y) points sampled at equal time intervals around a closed curve. If you uploaded an image, we need to extract that curve first. The algorithm converts the image to grayscale, applies Otsu thresholding to produce a binary black-and-white mask, then runs a marching-squares contour tracer to find the dominant closed boundary.",
            },
            {
                type: "paragraph",
                text: "If you drew freehand, you already gave us the path. Step 2 still shows it — confirming what gets passed to the Fourier transform. You can adjust the sensitivity and mode if the auto-detection missed the shape you wanted.",
            },
            {
                type: "demo",
                url: "/playground/fourier-drawing-machine/phase2.html",
                title: "Phase 2 — Edge Detection",
                height: 440,
            },

            // ── Fourier math ──────────────────────────────────────────────────
            {
                type: "heading",
                text: "Step 3: The Fourier Transform",
            },
            {
                type: "paragraph",
                text: "We now have a sequence of N complex numbers z₀, z₁, …, z_{N−1}, where each zₖ = x(k) + iy(k) encodes a 2D point as a single complex value. The Discrete Fourier Transform decomposes this sequence into N rotating vectors, one for each frequency n:",
            },
            {
                type: "formula",
                id: "dft-coefficients",
            },
            {
                type: "paragraph",
                text: "Each coefficient cₙ is itself a complex number. Its magnitude |cₙ| becomes the radius of a spinning circle (arm length). Its argument ∠cₙ is the starting angle of that circle. Its index n is the number of full rotations per period — n=0 is a static offset, n=1 spins once per period counterclockwise, n=−1 spins once clockwise, n=3 spins three times counterclockwise, and so on.",
            },
            {
                type: "paragraph",
                text: "Stack all N circles tip-to-tail, each spinning at its own rate, and the position of the final tip at time t is exactly the original path point z(t). The reconstruction formula is the inverse transform:",
            },
            {
                type: "formula",
                id: "fourier-series",
            },
            {
                type: "callout",
                text: "In practice we sort the circles by radius (largest first) and let you choose how many to include. With all N terms the reconstruction is mathematically exact. Remove high-frequency terms and the path smooths — fine detail disappears, but the coarse shape survives. The Gibbs phenomenon makes sharp corners always overshoot by ~9%, no matter how many terms you add.",
            },

            // ── Phase 3 ───────────────────────────────────────────────────────
            {
                type: "demo",
                url: "/playground/fourier-drawing-machine/phase3.html",
                title: "Phase 3 — Reconstruction",
                height: 620,
            },
            {
                type: "paragraph",
                text: "Use the Circles slider to remove high-frequency terms and watch what happens to the traced path. Open the Formula panel to see the actual computed coefficients for your shape — the amplitude, frequency, and phase of each spinning arm.",
            },

            // ── Applications ──────────────────────────────────────────────────
            {
                type: "heading",
                text: "Why this matters beyond drawing",
            },
            {
                type: "paragraph",
                text: "The drawing machine is a toy, but the mathematics is foundational. JPEG compression uses the 2D Discrete Cosine Transform (a close relative) to decompose images into frequency bands, discard what the eye can't see, and store only what remains. MP3 and AAC do the same for audio. MRI scanners collect data directly in Fourier space and reconstruct images by computing the inverse transform. WiFi and 4G use OFDM — Orthogonal Frequency Division Multiplexing — to pack multiple signals into a single channel by modulating independent frequency bands. The Fast Fourier Transform, which computes all N coefficients in O(N log N) instead of O(N²), makes all of this practical at scale.",
            },
            {
                type: "paragraph",
                text: "The deeper you go with Fourier analysis, the more you realize: the universe has a preference for sinusoids. Light, sound, heat, quantum wavefunctions — all naturally decompose into frequency components. What makes the drawing machine valuable isn't the drawing. It's making that decomposition viscerally visible in a way no equation alone can.",
            },
        ],
    },
]

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug)
}
