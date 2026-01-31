
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                        } catch { }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tasks } = await req.json();

        // 1. Analyze tasks with LLM to get scores
        const { object } = await generateObject({
            model: openai("gpt-4o"),
            schema: z.object({
                scoredTasks: z.array(z.object({
                    id: z.string(),
                    score: z.number().describe("0-100 priority score based on urgency, importance, and deadlines"),
                    reasoning: z.string().describe("Brief reason for the score")
                }))
            }),
            system: "You are a highly intelligent task prioritization engine (Neural Sort). Analyze the following tasks and assign a priority score (0-100) to each. Higher score means do first. Consider deadlines (overdue is critical), priority flags, semantic importance, and estimated effort vs impact.",
            prompt: `Tasks to analyze: ${JSON.stringify(tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                priority: t.priority,
                deadline: t.dueDate,
                status: t.status,
                urgency: t.urgency,
                importance: t.importance
            })))}`
        });

        const scoredMap = new Map(object.scoredTasks.map(t => [t.id, t]));

        // 2. Return the sorted/scored data
        return NextResponse.json({
            scoredTasks: object.scoredTasks.sort((a, b) => b.score - a.score)
        });

    } catch (error: any) {
        console.error("Neural sort error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
