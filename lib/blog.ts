
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

    // ── AI ────────────────────────────────────────────────────────────────────
    {
        slug: "chatgpt-apps",
        title: "ChatGPT Apps: When Your AI Can Actually Do Things, Not Just Tell You About Them",
        date: "March 6, 2026",
        readTime: "7 min read",
        category: "AI",
        topics: ["Connectors", "Tools"],
        platforms: ["ChatGPT"],
        excerpt:
            "For two years, ChatGPT could tell you where to order dinner. Now it can order it. Apps connect third-party services directly into your conversations — DoorDash, Zillow, Khan Academy, Apple Music — so the AI stops stopping at advice.",
        content: [
            {
                type: "paragraph",
                text: "For the first two years of ChatGPT, there was a clear ceiling on what it could actually do for you. It could tell you which restaurant to try. It could explain what apartments in a neighborhood are going for. It could walk you through a math problem step by step. But it couldn't place the order, pull up live listings, or let you actually practice. That ceiling is what Apps were built to remove.",
            },
            {
                type: "paragraph",
                text: "OpenAI launched Apps in ChatGPT in October 2025 — a way for third-party services to connect directly to your conversations. The App Directory followed in December. Now when you're talking through dinner options, you can pull DoorDash into the conversation and actually place the order. When you're weighing up neighborhoods, Zillow can surface live listings right there in the chat. The shift is from ChatGPT telling you things to ChatGPT doing things, and it changes how the whole tool feels.",
            },
            {
                type: "heading",
                text: "What's Actually in the App Directory",
            },
            {
                type: "paragraph",
                text: "Four apps launched with the directory. They cover very different use cases, but the underlying pattern is the same across all of them:",
            },
            {
                type: "diagram",
                id: "chatgpt-apps-directory",
            },
            {
                type: "paragraph",
                text: "The common thread: something that used to require leaving ChatGPT, opening a separate app, doing the task, and coming back can now happen without breaking the conversation. The AI doesn't hand you off — it just handles it.",
            },
            {
                type: "heading",
                text: "How to Find and Use an App",
            },
            {
                type: "paragraph",
                text: "The App Directory lives in the tools menu inside ChatGPT — web, iOS, and Android. Browse by category (Featured, Lifestyle, Productivity, Education, Shopping), find something you want, and connect it. Connecting takes about 10 seconds: you authorize the app to access your account via OAuth, and it appears in your workspace. From that point, you can invoke it in any conversation with an @ mention, or ChatGPT may suggest it on its own when the context fits.",
            },
            {
                type: "diagram",
                id: "chatgpt-apps-invoke",
            },
            {
                type: "heading",
                text: "When It Actually Makes Sense to Use One",
            },
            {
                type: "paragraph",
                text: "Apps work best at natural handoff points — the moments in a conversation where you'd normally stop, switch to another app, do the thing, and come back. DoorDash when you're talking through what to eat. Zillow when you've been asking about a neighborhood and want to see what's available. Khan Academy when a concept comes up in a study session and you want to practice rather than just read about it. The value isn't replacing those apps — it's removing the context switch.",
            },
            {
                type: "callout",
                text: "The apps that make the most sense are the ones you're already interrupting conversations to go use. If talking to ChatGPT reliably leads you to open another app, that's the app that should be in your @ menu.",
            },
            {
                type: "heading",
                text: "What's Still Limited",
            },
            {
                type: "paragraph",
                text: "Apps aren't available everywhere yet. Users in the EU, UK, and Switzerland are waiting on a regulatory-compliant rollout. The directory is still small — four launch apps is a starting point. And each connection requires authorizing account access, so it's worth reading what permissions you're granting before approving. The SDK is still in beta, which means the app roster will grow but unevenly for now.",
            },
            {
                type: "list",
                heading: "Current limitations worth knowing:",
                items: [
                    "Not available in EEA, Switzerland, or UK — regulatory review is still in progress",
                    "Small directory at launch — four apps is a foundation, not a fully-built ecosystem",
                    "Account authorization required — each app gets scoped access, worth reviewing before you connect",
                    "ChatGPT's auto-suggest isn't always reliable — invoking via @ mention is more consistent than waiting for it to surface the app",
                ],
            },
            {
                type: "heading",
                text: "Getting Started",
            },
            {
                type: "paragraph",
                text: "Open ChatGPT, tap the tools menu, and browse the App Directory. Find something you already use regularly in a separate app. Connect it. Then bring it into a conversation where it naturally belongs — not as a test, just as part of something you were already doing. The first time the handoff works the way it's supposed to, the value becomes obvious fast.",
            },
        ],
    },
    {
        slug: "chatgpt-projects-and-gpts",
        title: "ChatGPT Projects & Custom GPTs: The Features That Actually Change How You Work",
        date: "March 4, 2026",
        readTime: "7 min read",
        category: "AI",
        topics: ["Assistants", "Tools"],
        platforms: ["ChatGPT"],
        excerpt:
            "Most people treat ChatGPT like a smarter search engine. Projects and Custom GPTs transform it into a persistent, specialized work partner — and most users have never touched either.",
        content: [
            {
                type: "paragraph",
                text: "Most people still use ChatGPT the same way they used Google in 2005: ask a question, get an answer, close the tab. The interaction is disposable. No memory, no context, no continuity. If this describes your workflow, you're using one of the most capable AI tools available at roughly 20% of its potential.",
            },
            {
                type: "paragraph",
                text: "Two features change this completely: Projects and Custom GPTs. They've been quietly available for months, and almost no one uses them well. Together, they let you build persistent, specialized AI environments that remember your context, know your files, and behave the way you actually need them to.",
            },
            {
                type: "heading",
                text: "ChatGPT Projects: Context That Actually Sticks",
            },
            {
                type: "paragraph",
                text: "Projects are ChatGPT's answer to the single biggest frustration with AI chat: having to re-explain yourself every session. Before Projects, every new conversation started cold — no awareness of what you'd worked on, who you were, or what you'd already covered.",
            },
            {
                type: "paragraph",
                text: "A Project is a persistent workspace. Inside one, you can upload files that stay accessible across every conversation in that project, set custom instructions specific to that context, and keep all related conversations organized in one place. The AI knows about your codebase, your research notes, your client brief — without you re-uploading everything every time.",
            },
            {
                type: "list",
                heading: "What this looks like in practice:",
                items: [
                    "A 'Client Work' project with uploaded briefs, past deliverables, and brand guidelines — every draft starts with the full context already loaded",
                    "A 'Research' project with annotated PDFs, an outline, and writing style notes — no re-explaining your thesis every session",
                    "A 'Code' project with your repository structure and architecture preferences — so suggestions stay consistent with your existing patterns",
                    "A 'Personal Finance' project with your budget, goals, and past decisions — for advice that's actually specific to you",
                ],
            },
            {
                type: "heading",
                text: "Custom GPTs: Build the AI You Actually Need",
            },
            {
                type: "paragraph",
                text: "Custom GPTs let you create specialized AI assistants — pre-configured with the instructions, knowledge, and capabilities of a specific role. You build them through a simple interface with no coding required, and the result is a GPT that behaves like a focused expert rather than a general-purpose assistant.",
            },
            {
                type: "paragraph",
                text: "The configuration covers three main areas. First, custom instructions: you define what the GPT is, how it responds, what it prioritizes, and what it avoids. Second, knowledge files: you upload documents the GPT draws from — your firm's style guide, your product documentation, your personal knowledge base. Third, capabilities: web browsing, code execution, and optional API integrations for live external data.",
            },
            {
                type: "list",
                heading: "Examples of Custom GPTs that actually get used every day:",
                items: [
                    "A Sales Coach GPT trained on your product positioning, common objections, and ideal customer profile",
                    "A Research Analyst GPT that applies your citation standards and stays within your specific domain",
                    "An Onboarding Guide GPT loaded with your company's internal documentation and policies",
                    "A Content Reviewer GPT that enforces your brand voice across every piece of copy",
                    "A Personal Writing Coach GPT that knows your goals, weak points, and current projects",
                ],
            },
            {
                type: "diagram",
                id: "chatgpt-architecture",
            },
            {
                type: "callout",
                text: "The most valuable Custom GPTs solve a problem you face repeatedly. If you're re-explaining the same context to ChatGPT more than twice a week, that's a Custom GPT waiting to be built.",
            },
            {
                type: "heading",
                text: "Where Most Users Go Wrong",
            },
            {
                type: "paragraph",
                text: "The common mistake is treating both features as advanced extras — something to explore once you've 'mastered the basics.' This gets it exactly backwards. Projects and Custom GPTs aren't advanced features. They're the foundation. Using ChatGPT seriously without them is like using a word processor but ignoring the ability to save files.",
            },
            {
                type: "paragraph",
                text: "The second mistake is building Custom GPTs that are too broad. A GPT called 'Research Assistant' that can 'help with any research' is almost useless. A GPT called 'Competitive Intelligence Analyst' that knows your industry, your competitors by name, and outputs in a specific structured format — that one gets used every day.",
            },
            {
                type: "heading",
                text: "Getting Started",
            },
            {
                type: "paragraph",
                text: "Pick your highest-friction recurring AI task — the one where you spend the most time re-explaining context or getting outputs that are almost but not quite right. Build a Project or Custom GPT around it. Give it 30 minutes. If it cuts your setup time in half within the first week, you'll never go back to starting cold.",
            },
            {
                type: "paragraph",
                text: "This is what separating from the average AI user actually looks like. Not using more tools — using fewer, better, with more intention.",
            },
        ],
    },
    {
        slug: "perplexity-computer",
        title: "Perplexity Computer: The AI Digital Worker That Orchestrates 19 Models to Get Work Done",
        date: "February 26, 2026",
        readTime: "9 min read",
        category: "AI",
        topics: ["AI Agents", "Writing", "Research"],
        platforms: ["Perplexity"],
        excerpt:
            "Perplexity Computer isn't a browser tool. It's a cloud-based digital worker that decomposes goals into tasks, routes each to one of 19 AI models, connects to 400+ apps, and delivers finished work — autonomously, for hours or months.",
        content: [
            {
                type: "paragraph",
                text: "When Perplexity launched Computer on February 25, 2026, CEO Aravind Srinivas described it as 'one system that unifies every current AI capability: Research. Design. Code. Deploy.' That framing matters. Perplexity Computer is not a browser automation tool or a search upgrade. It is a cloud-based digital worker — an autonomous agent that takes a goal stated in natural language, decomposes it into subtasks, routes each to the most capable AI model available, uses real tools to execute the work, and delivers finished output.",
            },
            {
                type: "paragraph",
                text: "The architectural choice that makes this distinct from everything else: Perplexity Computer orchestrates 19 AI models simultaneously — the largest publicly disclosed multi-model setup in any consumer AI product at launch. Rather than building or fine-tuning its own frontier models, Perplexity built an orchestration layer that sends each task to whichever model performs best for that specific type of work. Claude for reasoning and coding. Gemini for deep research. GPT for long-context recall. Grok for speed-sensitive tasks.",
            },
            {
                type: "diagram",
                id: "perplexity-architecture",
            },
            {
                type: "heading",
                text: "The 19-Model Orchestration Engine",
            },
            {
                type: "paragraph",
                text: "Only 6 of the 19 underlying models have been publicly named by Perplexity. The remaining 13 are undisclosed, with Perplexity noting the roster will change as models demonstrate strength in new domains.",
            },
            {
                type: "list",
                heading: "The 6 publicly named models and their designated roles:",
                items: [
                    "Claude Opus 4.6 (Anthropic) — core reasoning engine, orchestration logic, and coding tasks",
                    "Gemini (Google) — deep research, creates and manages sub-agents for parallel investigation",
                    "GPT-5.2 (OpenAI) — long-context recall and expansive web search across large document sets",
                    "Grok (xAI) — lightweight, speed-sensitive tasks where latency matters",
                    "Nano Banana (Google) — image generation within workflows",
                    "Veo 3.1 (Google) — video generation for content and presentation workflows",
                ],
            },
            {
                type: "paragraph",
                text: "The model routing is not static or rule-based. The orchestration layer evaluates each subtask and selects the current best-performing model for that specific function. As better models emerge, Perplexity can swap them in without changing the user-facing product.",
            },
            {
                type: "heading",
                text: "What It Can Actually Do",
            },
            {
                type: "paragraph",
                text: "Perplexity Computer's capability set is significantly broader than a browser-use agent. It runs across research, document work, code, and multi-app workflows — all from a single natural-language instruction.",
            },
            {
                type: "list",
                heading: "Core capabilities:",
                items: [
                    "Runs 7 search types in parallel — web, academic, people, image, video, shopping, and social — reading full source pages rather than snippets, and cross-referencing scholarly databases directly",
                    "Creates, edits, and organizes files: documents, multi-sheet spreadsheets, CSVs, PDFs, images, and slide decks",
                    "Builds financial models, research reports, and presentations from scratch based on a brief",
                    "Writes code from specification to deployment, including pushing to GitHub (with a human-approval pause before committing)",
                    "Executes command-line tools inside an isolated cloud compute environment",
                    "Drafts and sends emails with generated file attachments via Gmail or Outlook",
                    "Runs complete multi-step workflows — from research through analysis through delivery — for 'hours or even months' without re-prompting",
                    "Retains persistent memory of project context, files, preferences, and prior research across sessions",
                ],
            },
            {
                type: "heading",
                text: "400+ Connected Apps",
            },
            {
                type: "paragraph",
                text: "Computer connects to external tools and data sources through a growing connector library. At launch, named integrations include Gmail, Outlook, GitHub, Linear, Slack, Notion, Snowflake, Databricks, and Salesforce, with premium data connectors for finance and enterprise tools. The system requests limited, scoped tokens for each integration — access sufficient for the specific task, not broad account permissions.",
            },
            {
                type: "callout",
                text: "The key workflow shift: you describe an outcome in plain language and Computer figures out which apps to touch, in what order, to produce it. 'Research our top 5 competitors, build a pricing comparison spreadsheet, and email it to the team with a summary' is a single instruction.",
            },
            {
                type: "heading",
                text: "Safety by Design: Cloud Sandbox + Approval Gates",
            },
            {
                type: "paragraph",
                text: "Every task runs inside an isolated cloud compute environment — a real filesystem, a real browser with live internet access, and real tool integrations, but fully sandboxed from your local machine. This is a deliberate architectural choice. Srinivas explicitly positioned this against local computer-use agents (like OpenClaw), which he compared to 'malware' for their broad access to local files, saved passwords, and system settings. The trade-off: Computer cannot touch your desktop. Everything stays inside the cloud environment.",
            },
            {
                type: "paragraph",
                text: "Before taking any irreversible action — publishing a website, pushing code to GitHub, sending an email — Computer pauses and requests explicit human approval. This pause is configurable: you can pre-authorize specific action types for specific workflows, or require approval for every irreversible step. A monthly spending cap (default $200, adjustable to $2,000) provides a financial guardrail for credit consumption.",
            },
            {
                type: "heading",
                text: "How It Compares to Operator and Claude Computer Use",
            },
            {
                type: "paragraph",
                text: "Perplexity Computer, OpenAI Operator, and Claude Computer Use are all agentic AI products, but they solve different problems in different ways.",
            },
            {
                type: "list",
                items: [
                    "vs. OpenAI Operator ($200/month): both are consumer subscription products at the same price point. Operator excels at precise, deterministic web automation — booking flights, filling forms, navigating specific web interfaces. Computer excels at long-form research, document creation, and multi-app workflows. Operator runs on a single GPT-4o-based model; Computer routes across 19 models.",
                    "vs. Claude Computer Use (API): Claude CUE is a developer API that gives an AI model direct control over a real computer's screen and cursor — it can click any UI element on your actual desktop. Computer is a consumer-facing web product with no local access. CUE is more powerful for technical tasks requiring deep system access; Computer is far more accessible and handles the infrastructure for you.",
                    "vs. OpenClaw (open-source local agent): OpenClaw runs on your machine with broad system access — Perplexity's CEO's explicit comparison for why cloud-sandboxed is safer. Computer cannot match OpenClaw's raw local capability, but requires no setup, no API keys, and poses no local security risk.",
                ],
            },
            {
                type: "heading",
                text: "Samsung Galaxy S26: OS-Level Integration",
            },
            {
                type: "paragraph",
                text: "Announced simultaneously with Computer's launch, Perplexity is embedded at the OS level in the Samsung Galaxy S26 — with a 'Hey Plex' wake word and direct access to native Samsung apps: Notes, Calendar, Gallery, Clock, and Reminders. Bixby uses Perplexity APIs on the backend. This is the first time a non-Google AI has received OS-level integration in a Samsung device, and it signals that Perplexity Computer's scope extends well beyond the web browser.",
            },
            {
                type: "heading",
                text: "The Pricing Reality: $200/Month, 10,000 Credits",
            },
            {
                type: "paragraph",
                text: "Computer is currently exclusive to Perplexity's Max tier at $200/month (or $2,000/year). Max subscribers receive 10,000 credits per month, with a one-time launch bonus of 35,000 credits. Credits are consumed per task — a complex workflow runs approximately 1,000 credits. At the base allocation, that's roughly 10–40 substantial tasks per month before credits run out. When credits are exhausted, active tasks pause rather than cancel, and resume when credits are replenished. A Pro tier rollout was announced for 'coming weeks' after launch.",
            },
            {
                type: "heading",
                text: "The Genuine Limitations",
            },
            {
                type: "list",
                items: [
                    "Credit ceiling: 10,000 credits/month means approximately 10–40 complex tasks before running out — heavy users will either hit the cap or pay for additional credits",
                    "Cloud-only by design: cannot access local files outside connected apps — deeply local workflows remain out of reach",
                    "No arbitrary desktop UI control: operates its own sandboxed browser, not your screen — tasks requiring interaction with non-integrated desktop apps aren't possible",
                    "Mid-task pauses: complex long-running workflows sometimes require human clarification beyond the configured safety gates",
                    "Model dependency risk: Perplexity owns none of the 19 underlying models — if OpenAI, Anthropic, Google, or xAI restricts API access or raises prices, the orchestration layer is directly affected",
                    "Early-stage product: Perplexity canceled its planned press demo hours before the February 25 launch after discovering internal flaws — the product shipped in a working but early state",
                ],
            },
            {
                type: "heading",
                text: "Why This Shift Matters",
            },
            {
                type: "paragraph",
                text: "Perplexity Computer represents the clearest articulation yet of where AI tools are heading: from 'answer me' to 'do this for me.' Search gives you information. Computer gets work done. The distinction sounds simple, but it changes the nature of what AI is useful for, and how much leverage it can create per hour of human attention.",
            },
            {
                type: "paragraph",
                text: "The people building fluency with agentic AI now — learning what goals to hand to an agent, how to frame them clearly, where to keep human oversight, and how to structure workflows for autonomous execution — are building a compounding skill advantage. As these tools roll down to lower price tiers and the capabilities deepen, that fluency gap will widen considerably.",
            },
            {
                type: "heading",
                text: "Getting Started",
            },
            {
                type: "paragraph",
                text: "Start with a complete, end-to-end task you currently do manually on a weekly or monthly basis — not a single-step lookup, but a genuine multi-step workflow: gather information from multiple sources, synthesize it, produce a document, distribute it. Describe the outcome you want in plain language and let Computer figure out the steps. Watch where it pauses for clarification; those gaps are your instructions getting clearer.",
            },
            {
                type: "paragraph",
                text: "The goal isn't to automate everything. It's to understand which work belongs to you and which belongs to an agent working on your behalf. Building that judgment — and the habit of delegating at the right level of abstraction — is the core productivity skill of the next several years.",
            },
        ],
    },
    {
        slug: "chatgpt-canvas",
        title: "ChatGPT Canvas: The AI Writing & Coding Workspace You Didn't Know You Needed",
        date: "February 14, 2026",
        readTime: "7 min read",
        category: "AI",
        topics: ["Writing", "Coding", "Tools"],
        platforms: ["ChatGPT"],
        excerpt:
            "Canvas turns ChatGPT into a side-by-side editor where you work directly on the document — not in chat replies. Version history, live code rendering, one-click shortcuts. It's the tool most users have never found.",
        content: [
            {
                type: "paragraph",
                text: "Here's what using ChatGPT for real writing work actually looks like without Canvas: you get a response, copy it out, paste it somewhere else, make your edits, switch back, re-explain what changed, get a new version that ignores half of it. For a quick reply, fine. For a report you're going to iterate on for 30 minutes — a proposal, a technical doc, anything with structure — it's a low-grade friction that stacks up fast.",
            },
            {
                type: "paragraph",
                text: "Canvas removes it. It opens a side-by-side editing workspace directly inside ChatGPT. The document or code lives in a right panel — you work in it directly, highlight what needs changing, and ChatGPT modifies that section, not the whole thing from scratch. Everything auto-saves. Full version history lives in the back button. The first time you use it after months of copy-pasting, the improvement is immediate.",
            },
            {
                type: "heading",
                text: "How to Open It",
            },
            {
                type: "paragraph",
                text: "Canvas opens automatically when ChatGPT detects a substantial writing or coding task — roughly when the output would exceed ten lines. You can also force it: type \"/\" in the composer and select canvas, or hit the shortcut in the upper right of the input box. The back button in the toolbar holds your full version history. I've used it to recover a draft mangled by an overly aggressive edit request more times than I'd like to admit.",
            },
            {
                type: "heading",
                text: "Writing Shortcuts That Actually Change Your Workflow",
            },
            {
                type: "paragraph",
                text: "The shortcuts are where Canvas earns its keep. You can shift the reading level of the entire document in one click — useful when you write for your own comprehension level and then realize it needs to land with a different audience. Length controls expand or compress the whole piece without disrupting structure. The polish pass runs grammar, clarity, and consistency checks across the full document at once, replacing what used to be five separate prompt exchanges.",
            },
            {
                type: "list",
                heading: "Writing shortcuts in Canvas:",
                items: [
                    "Adjust length — expand or compress the document while preserving structure and meaning",
                    "Change reading level — one click from simplified to graduate-level, matched to your audience",
                    "Add final polish — grammar, clarity, and consistency check run across the full document at once",
                    "Suggest edits — ChatGPT marks specific sections with inline suggestions you accept or reject individually",
                    "Direct editing — click anywhere and type; your changes are preserved and ChatGPT responds to them contextually",
                ],
            },
            {
                type: "heading",
                text: "Coding and Live Preview",
            },
            {
                type: "paragraph",
                text: "The January 2025 update added HTML and React rendering — write a component and it renders live in the canvas panel. Interact with the preview, ask for changes, and they apply directly to the code. No separate editor, no dev server, no copy-pasting between environments. For building quick interfaces or prototyping anything visual, this collapses the tool count from three down to one.",
            },
            {
                type: "diagram",
                id: "canvas-comparison",
            },
            {
                type: "list",
                heading: "Coding shortcuts in Canvas:",
                items: [
                    "Review code — inline suggestions with explanations, like a code review from a colleague",
                    "Add comments — auto-generates documentation throughout the file, targeted to non-obvious logic",
                    "Add logs — inserts console.log / print statements for debugging at key logic branches",
                    "Fix bugs — detects and rewrites problematic sections with a plain-English explanation of what was wrong",
                    "Port to a language — translates your code to JavaScript, TypeScript, Python, Java, C++, or PHP",
                    "Live preview (HTML/React) — renders your output directly in the canvas panel",
                ],
            },
            {
                type: "diagram",
                id: "canvas-shortcuts",
            },
            {
                type: "callout",
                text: "The right question isn't whether Canvas is better than standard chat — it's whether your task is a conversation or a document. If you're asking a question, chat is fine. If you're getting something done, Canvas is the right environment.",
            },
            {
                type: "heading",
                text: "Where It Pays Off Most",
            },
            {
                type: "list",
                heading: "Use cases where Canvas makes a clear difference:",
                items: [
                    "Long-form writing: blog posts, proposals, reports — anything over 500 words you'll iterate on across multiple rounds",
                    "Technical writing: API docs, README files, spec sheets where structure and tone both matter",
                    "Code projects: building components, writing scripts, prototyping UI with live visual feedback",
                    "Academic writing: essays and papers where adjusting reading level and running polish passes is part of the process",
                    "Presentation outlines: structuring a talk where you need to reorganize sections without disrupting others",
                ],
            },
            {
                type: "paragraph",
                text: "Canvas is available across all subscription tiers — Free, Plus, Pro, Team, Enterprise, and Edu — on web, Windows, and macOS.",
            },
            {
                type: "heading",
                text: "Getting Started",
            },
            {
                type: "paragraph",
                text: "Next time you get a ChatGPT response you're about to copy and paste somewhere to edit — stop. Ask it to open the document in Canvas instead. Work in it directly. Highlight the parts that need changing rather than re-describing the whole thing. Try the reading level and length shortcuts. See how it feels different from the back-and-forth chat loop. Most people who try it don't go back.",
            },
        ],
    },
    {
        slug: "chatgpt-deep-research",
        title: "ChatGPT Deep Research: How AI Can Do 30 Minutes of Research in Seconds",
        date: "January 10, 2026",
        readTime: "8 min read",
        category: "AI",
        topics: ["Research", "AI Agents"],
        platforms: ["ChatGPT"],
        excerpt:
            "Deep Research isn't a smarter search. It's an autonomous agent that reads 50–200 sources, synthesizes them, and delivers a structured cited report — while you're doing something else.",
        content: [
            {
                type: "paragraph",
                text: "Thirty minutes of research, done in under five. Not because the AI is smarter than you — but because it doesn't get distracted, doesn't open fourteen tabs and forget which one had the relevant thing, and doesn't spend half its time on a source that turned out to be two years out of date. That's the actual value: it executes the grind part so you can focus on what to do with the findings.",
            },
            {
                type: "paragraph",
                text: "ChatGPT's Deep Research is an autonomous research agent. Give it a question, and it shows you a plan — the subtasks it's going to investigate — before doing anything. Once you approve, it goes. In the background, it reads 50 to 200 sources, synthesizes as it goes, and drops a structured cited report into your chat when it's done. The February 2026 update moved it onto a GPT-5.2 model and improved the output formatting meaningfully: better section structure, cleaner citations, and a progress sidebar that shows you what it's actually reading.",
            },
            {
                type: "heading",
                text: "How It Works",
            },
            {
                type: "paragraph",
                text: "The pipeline has five steps, and knowing them makes a real difference in how you prompt. It starts with decomposition — the model breaks your question into subtasks and shows them to you before starting. You can push back, narrow the scope, or add context. Most people skip this and just hit go. That's a mistake. Thirty seconds of adjustment at this step changes the quality of the final report more than anything else you can do.",
            },
            {
                type: "diagram",
                id: "deep-research-pipeline",
            },
            {
                type: "paragraph",
                text: "The output is a document, not a chat reply. It has a structured summary at the top, organized sections by subtopic, inline citations throughout, and a full reference list at the end. For a substantive question, expect 1,500–3,000 words, fully sourced.",
            },
            {
                type: "heading",
                text: "What It's Good For",
            },
            {
                type: "paragraph",
                text: "The pattern behind every strong Deep Research use case is the same: you need to understand a landscape, not just locate a fact. Competitive intelligence. Literature reviews. Regulatory tracking across multiple agencies. Understanding an unfamiliar industry before a meeting. Pre-call research on a company or executive. These would normally cost 1–3 hours of scattered tab-switching. Deep Research turns them into a 20-minute wait.",
            },
            {
                type: "list",
                heading: "Less obvious but equally useful:",
                items: [
                    "Fact-checking a draft you've already written — run it against current sources to find outdated or unsupported claims",
                    "Building a knowledge base entry on a technical topic — get a structured overview with citations your team can extend",
                    "Tracking what's changed in a field over the past year — useful before conferences, investor meetings, or strategic planning",
                    "Understanding a contract's context — what's standard in this type of agreement, what terms are unusual",
                ],
            },
            {
                type: "heading",
                text: "Writing Prompts That Work",
            },
            {
                type: "paragraph",
                text: "Vague prompts produce vague reports. 'Research AI in healthcare' gives you a mile-wide overview with no depth anywhere. Deep Research performs best when you treat it like briefing a research analyst: what's the specific question, what's the goal, what's in scope, what should be excluded, and what format do you actually need.",
            },
            {
                type: "callout",
                text: "The best prompts answer four things upfront: What is the specific question? What is the goal of this research? What's in scope and what should be excluded? What format should the output take?",
            },
            {
                type: "list",
                heading: "A prompt structure that reliably works:",
                items: [
                    "Specific question: 'I want to understand how major U.S. health insurers are approaching AI-assisted claims processing in 2025.'",
                    "Scope: 'Focus on publicly disclosed initiatives, regulatory filings, and analyst coverage. Skip speculative editorial pieces.'",
                    "Format: 'Deliver a structured report with an executive summary, key findings per company, and a comparison table.'",
                    "Context: 'I'm preparing for a pitch to a mid-sized regional insurer. I need to understand the competitive landscape they're navigating.'",
                ],
            },
            {
                type: "heading",
                text: "How It Compares to Manual Research",
            },
            {
                type: "diagram",
                id: "deep-research-comparison",
            },
            {
                type: "heading",
                text: "The Honest Limitations",
            },
            {
                type: "paragraph",
                text: "Deep Research doesn't access paywalled content — academic journals, proprietary databases, subscription news are all out of reach. It occasionally hallucinates specifics when sources are thin. It can't run original analysis; everything is synthesis of what already exists publicly. And the monthly query limits are real: Plus and Team subscribers get 10 full-model queries per 30 days, Pro gets 125, and Free users get 5 lightweight queries.",
            },
            {
                type: "list",
                heading: "Limitations to keep in mind:",
                items: [
                    "No paywalled content — journals, databases, and subscription news are inaccessible regardless of your subscription tier",
                    "Hallucination risk when sources are sparse — always cross-check surprising specific claims before acting on them",
                    "Source quality varies — it doesn't always distinguish primary sources from secondary commentary; verify citations that matter",
                    "Not for real-time lookups — reports take 5–30 minutes; build that into your workflow",
                    "Monthly query caps — 10 full-model queries for Plus/Team, 125 for Pro, 5 lightweight for Free",
                ],
            },
            {
                type: "heading",
                text: "Getting Started",
            },
            {
                type: "paragraph",
                text: "Pick something you've been meaning to research but keep deferring because it'll take an hour you don't have. Write it as a specific brief rather than a vague question. Run it while you do something else. When the report arrives, use it to find the two or three threads worth going deeper on yourself — those become your next questions, and the process compounds from there.",
            },
        ],
    },

    // ── Projects ─────────────────────────────────────────────────────────────
    /* {
        slug: "mcp-injection-lab",
        title: "MCP Injection Lab: 28 Pages That Try to Hijack Your AI Agent",
        date: "2025",
        readTime: "10 min read",
        category: "Projects",
        topics: ["Security", "AI", "Research"],
        excerpt:
            "I built 28 realistic-looking web pages — blog posts, API docs, job listings, RSS feeds — each embedded with hidden prompt injections at increasing levels of sophistication. Send your AI agent to browse them. See if it gets manipulated.",
        content: [
            // ── Intro ─────────────────────────────────────────────────────────
            {
                type: "paragraph",
                text: "Every time an AI agent browses a web page, it's trusting that the content is what it appears to be. A tech blog is just a tech blog. An API documentation page is just documentation. A job listing is just a job listing. But what happens when the page isn't? What happens when the person who wrote the page anticipated that an AI agent would read it — and embedded instructions specifically designed to manipulate what the agent does next?",
            },
            {
                type: "paragraph",
                text: "That's the question MCP Injection Lab is built to answer. It's a collection of 28 standalone web pages that look exactly like normal content — but contain hidden prompt injection payloads at varying levels of sophistication. Send your AI agent to summarize one of them. Watch what it does.",
            },
            {
                type: "demo",
                url: "/playground/mcp-injection-lab/index.html",
                title: "MCP Injection Lab",
                height: 750,
            },

            // ── What is indirect prompt injection ────────────────────────────
            {
                type: "heading",
                text: "The attack: indirect prompt injection",
            },
            {
                type: "paragraph",
                text: "Prompt injection is what happens when an attacker gets their instructions into the same context window as your AI agent. Direct injection is the obvious case — you're talking to an AI and you type in adversarial instructions yourself. Indirect injection is the subtler, more dangerous case: the instructions don't come from you at all. They come from data the agent processes on your behalf.",
            },
            {
                type: "paragraph",
                text: "An AI agent reading a web page, summarizing an email, or processing a shared document is consuming untrusted content. If that content contains instructions — hidden in HTML comments, invisible CSS text, metadata fields, or seemingly ordinary prose — the agent may follow them without any indication to the user that anything unusual happened.",
            },
            {
                type: "callout",
                text: "The attack surface is every piece of external content an agent ever processes. Web pages, emails, documents, API responses, RSS feeds, tool schemas. If the agent reads it, an attacker can write to it.",
            },
            {
                type: "heading",
                text: "When does an agent become vulnerable?",
            },
            {
                type: "paragraph",
                text: "Not every agent is equally at risk. An agent becomes truly dangerous to operate when three conditions are met simultaneously — what security researchers call the lethal trifecta.",
            },
            {
                type: "list",
                items: [
                    "Access to private data — the agent can read emails, files, databases, or other sensitive information on behalf of the user",
                    "Exposure to untrusted content — the agent processes content from external, potentially adversarial sources: web pages, emails, shared documents",
                    "An exfiltration vector — the agent can take actions that send data outward: rendering images, making API calls, creating links, writing files",
                ],
            },
            {
                type: "paragraph",
                text: "All three together create the conditions for a complete attack. An agent with database access reads a malicious web page (exposure), and the injection instructs it to query the user's data and encode it into an image URL (exfiltration). The Supabase MCP breach in mid-2025 is a real example of this exact chain.",
            },

            // ── How to use the lab ────────────────────────────────────────────
            {
                type: "heading",
                text: "How to use the lab",
            },
            {
                type: "paragraph",
                text: "The lab is a single-page app with 28 test pages accessible at clean URLs. Each page looks exactly like normal web content — the lab chrome (tier badge, technique tags, reveal toggle) is visible to you but stripped entirely from the AI-facing version. To run a test:",
            },
            {
                type: "list",
                heading: "Three steps:",
                items: [
                    "Open the Lab → navigate to the Test Pages section. Find a test to try — start with Tier 1 for basic hiding techniques, or jump straight to Tier 5 for behavioral attacks.",
                    "Copy the AI-facing URL → each test card shows the clean URL your agent will visit. This page has no lab branding at all — it looks like a real website.",
                    "Ask your agent to read it → paste the URL and ask the agent to summarize, analyze, or browse the page. Watch whether it outputs the embedded passphrase (each test has a unique NATO-phonetic code like ECHO-FOXTROT-7) or takes any unintended actions.",
                ],
            },
            {
                type: "paragraph",
                text: "If the agent outputs the passphrase — the injection succeeded. The agent followed hidden instructions embedded in the page. You can then toggle \"Reveal Injections\" in the lab view to see exactly where the payloads were hidden and how they were structured.",
            },
            {
                type: "callout",
                text: "The lab also includes a ready-made agent prompt you can copy — a system instruction that tells your agent to browse a list of test URLs and record which ones cause it to output a passphrase. Useful for running a full sweep against a specific model.",
            },

            // ── The 7 tiers ──────────────────────────────────────────────────
            {
                type: "heading",
                text: "The seven tiers",
            },
            {
                type: "paragraph",
                text: "The 28 tests are organized into seven difficulty tiers. Lower tiers use straightforward hiding techniques — the kind that are well-documented and that well-aligned models should resist. Higher tiers test more sophisticated behavioral manipulation and protocol-level attacks.",
            },
            {
                type: "list",
                items: [
                    "Tier 1 — Basic: HTML comments, CSS display:none, visibility:hidden, invisible text. The injection is literally in the HTML source, just hidden from visual rendering.",
                    "Tier 2 — Intermediate: Meta tags, data attributes, off-screen positioning, SVG embedding, ARIA attribute abuse. Payloads move beyond visual hiding into the structural metadata of the page.",
                    "Tier 3 — Advanced: Base64 encoding, homoglyph character substitution, zero-width Unicode characters, payload splitting across disconnected elements. Requires the agent to decode or reassemble the instruction.",
                    "Tier 4 — Expert: All previous techniques combined simultaneously. Persona hijacking attempts — instructions telling the agent it has a new identity with different rules. Multi-stage exfiltration chains (the EchoLeak pattern).",
                    "Tier 5 — Behavioral: The most dangerous class. Instead of asking the agent to reveal a passphrase, these tests try to change what the agent does — redirecting research, extracting system prompt data, triggering form interactions, chaining tool calls.",
                    "Tier 6 — MCP Protocol: Attacks that target the Model Context Protocol specifically. Tool schema poisoning, rug-pull (tool behavior changes after trust is established), cross-server shadowing, sampling injection.",
                    "Tier 7 — Novel Formats: Non-HTML attack surfaces. Alt-text and EXIF metadata injection for vision-capable agents, RSS/Atom CDATA sections, JSON API response values, robots.txt directives and structured data.",
                ],
            },

            // ── Density system ────────────────────────────────────────────────
            {
                type: "heading",
                text: "The density system",
            },
            {
                type: "paragraph",
                text: "Each test page has a density selector with four levels: Sparse, Moderate, Dense, and Saturated. This controls how many injection payloads are simultaneously active on the page — from a single carefully-placed injection up to 8+ overlapping techniques firing at once.",
            },
            {
                type: "paragraph",
                text: "The density system exists because real-world attacks aren't always single-payload. Unit 42 researchers documented adversarial pages containing 24+ simultaneous injection payloads. At Dense and Saturated levels, the lab simulates what those pages look like to an agent — overwhelming the agent's content-versus-instruction boundary with volume. Test 20 (the full attack chain) runs all eight behavioral attacks with all ten hiding techniques active at once, mirroring those real-world campaigns.",
            },

            // ── Methodology ──────────────────────────────────────────────────
            {
                type: "heading",
                text: "Research methodology",
            },
            {
                type: "paragraph",
                text: "The lab's threat model is specific: an AI agent is instructed by a user to browse, summarize, or analyze a web page. The attacker controls the page content but has no direct access to the agent's system prompt, tools, or conversation history. The attacker's only channel is the page content itself — HTML, CSS, metadata, structured data, and any non-visual elements the agent processes.",
            },
            {
                type: "paragraph",
                text: "Injection techniques are classified along three independent axes: delivery method (how the payload reaches the agent), obfuscation (how it evades detection), and behavioral objective (what the agent is manipulated to do). This produces a taxonomy of roughly 25 distinct technique categories across the seven tiers.",
            },
            {
                type: "list",
                heading: "Key design decisions:",
                items: [
                    "Realistic content first — every test page contains 1,000–3,000 words of genuine, useful content. Blog posts are well-written. API docs are accurate. Job listings are plausible. Agents should process the page as normal content before encountering injections — matching real-world conditions.",
                    "No lab branding on test pages — the 28 standalone HTML files (ai/1.html through ai/28.html) contain zero references to MCP Injection Lab, testing, or security research. An agent visiting these pages should perceive them as ordinary websites.",
                    "Passphrase-based detection — each test embeds a unique NATO-phonetic passphrase. Agent outputs the passphrase = injection succeeded. Binary, unambiguous, no interpretation required.",
                    "Canary tokens for exfiltration detection — fake AWS keys, GitHub PATs, Stripe API keys, and database connection strings are embedded in several tests. If the agent surfaces these in its output, it demonstrates willingness to extract and share credential-like data from processed content.",
                ],
            },
            {
                type: "heading",
                text: "Novel contributions",
            },
            {
                type: "paragraph",
                text: "Beyond implementing known techniques from published CVEs and research, the lab introduces several attack vectors not well-represented in existing injection benchmarks. Test 25 targets multimodal metadata: alt-text descriptions, EXIF field simulations, and structured image data for vision-capable agents. Tests 26–28 target non-HTML formats that most injection benchmarks ignore entirely: RSS/Atom feed CDATA sections, JSON API response fields and error messages, and crawler directive abuse via robots.txt, meta robots, and sitemap.xml.",
            },
            {
                type: "paragraph",
                text: "The density system is also novel as a research instrument. By controlling injection volume as an independent variable, it enables systematic study of the relationship between payload count and agent susceptibility — something existing benchmarks treat as fixed.",
            },

            // ── Real-world context ────────────────────────────────────────────
            {
                type: "heading",
                text: "Why this matters now",
            },
            {
                type: "paragraph",
                text: "Prompt injection has been a theoretical concern since the earliest days of LLM-powered agents. In 2025 it became operational. EchoLeak (CVE-2025-32711) demonstrated markdown image exfiltration from Microsoft Copilot — an agent processing an email with an injected payload would silently encode sensitive data into an image URL request to an attacker-controlled server. MCPoison (CVE-2025-54136) showed tool description poisoning in MCP servers. The Supabase MCP breach combined all three elements of the lethal trifecta in a single real-world attack.",
            },
            {
                type: "paragraph",
                text: "The OWASP LLM Top 10 ranks prompt injection as the number one attack vector for LLM applications. The OWASP MCP Top 10, published in 2025, identifies ten critical risks specific to Model Context Protocol-integrated systems — tool poisoning, rug pull, cross-server injection, sampling abuse, and others. All ten are represented in the lab's Tier 6 tests.",
            },
            {
                type: "callout",
                text: "The ATTESTMCP defense framework — which adds cryptographic capability attestation, message authentication, and server isolation to MCP — reduced overall attack success rates from 52.8% to 12.4% in testing. That 76.5% reduction suggests the attack surface is meaningful and the defenses are tractable. It also suggests the 47.2% of attacks that still succeed through a hardened framework deserve serious attention.",
            },
            {
                type: "heading",
                text: "Limitations",
            },
            {
                type: "list",
                items: [
                    "Passphrase-based success metrics may not capture subtle behavioral changes — an agent that softens its tone, changes its recommendations, or omits certain information because of an injection won't necessarily trigger any detection",
                    "Tests are static — real-world attacks can adapt dynamically based on agent responses",
                    "The leaderboard data is illustrative, based on published benchmarks and external evaluations, not direct systematic testing through the lab",
                    "The lab tests indirect injection only — direct injection (where the user themselves provides adversarial input) is out of scope",
                ],
            },
        ],
    }, */
]

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug)
}
