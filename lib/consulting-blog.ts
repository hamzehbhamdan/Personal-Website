
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
    tags: string[]
    excerpt: string
    content: ContentBlock[]
}

export const blogPosts: BlogPost[] = [
    {
        slug: "chatgpt-projects-and-gpts",
        title: "ChatGPT Projects & Custom GPTs: The Features That Actually Change How You Work",
        date: "March 4, 2026",
        readTime: "7 min read",
        tags: ["ChatGPT", "Productivity", "AI Tools"],
        excerpt: "Most people treat ChatGPT like a smarter search engine. Projects and Custom GPTs transform it into a persistent, specialized work partner — and most users have never touched either.",
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
        tags: ["Perplexity", "AI Agents", "Agentic AI"],
        excerpt: "Perplexity Computer isn't a browser tool. It's a cloud-based digital worker that decomposes goals into tasks, routes each to one of 19 AI models, connects to 400+ apps, and delivers finished work — autonomously, for hours or months.",
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
]

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find((post) => post.slug === slug)
}
