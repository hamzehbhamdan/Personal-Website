import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        const { weatherUnit = "F", userName = "User" } = body;

        // 1. Fetch top tasks
        const { data: tasks } = await supabase
            .from("tasks")
            .select("title, status, priority, due_date")
            .in("status", ["todo", "in-progress"])
            .order("created_at", { ascending: false })
            .limit(10); // Increased limit

        // 2. Fetch GCal Events (if token available)
        let calendarEvents: any[] = [];
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = body.token || session?.provider_token;

            if (token) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tonight = new Date(today);
                tonight.setHours(23, 59, 59, 999);

                // 1. Get List of Calendars
                const calListRes = await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (calListRes.ok) {
                    const calListData = await calListRes.json();
                    const availableCalendars = calListData.items || [];

                    // 2. Fetch events for each calendar (in parallel)
                    const results = await Promise.all(availableCalendars.map(async (cal: any) => {
                        const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${today.toISOString()}&timeMax=${tonight.toISOString()}&singleEvents=true&orderBy=startTime`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (eventsRes.ok) {
                            const data = await eventsRes.json();
                            return data.items?.map((e: any) => ({
                                summary: e.summary || 'Untitled Event',
                                start: e.start.dateTime || e.start.date,
                                end: e.end.dateTime || e.end.date,
                                calendar: cal.summary // Add calendar name for context
                            })) || [];
                        }
                        return [];
                    }));

                    // Flatten and deduplicate by summary + start time (simple heuristic since IDs might differ across syncs slightly or just to be safe)
                    // Better yet, just invalid duplicates if ID matches, but we don't have ID here easily without type changes.
                    // Let's just flatten and sort.
                    calendarEvents = results.flat().sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
                }
            }
        } catch (error) {
            console.error("GCal fetch error in briefing:", error);
        }

        // Build context
        const tasksSummary = tasks?.length
            ? tasks.map((t: any) => `- [Task] ${t.title} (${t.priority})`).join("\n")
            : "No active tasks.";

        const eventsSummary = calendarEvents.length
            ? calendarEvents.map((e: any) => `- [Event] ${e.summary} (${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) [${e.calendar}]`).join("\n")
            : "No calendar events scheduled for today.";

        const currentDate = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const prompt = `You are a concise, professional personal assistant for ${userName}. 
Today is ${currentDate}.

SCHEDULE & TASKS:
${eventsSummary}

ACTIVE DIRECTIVES:
${tasksSummary}

Generate a "Strategic Briefing" (approx 3-4 sentences) that:
1. Synthesizes the day's agenda (events + key tasks) into a cohesive narrative.
2. Specifically mentions the time of the first or most critical event if applicable.
3. Sets a productive tone.
4. Do NOT use emojis. Be strictly professional, slightly futuristic/cyberpunk in tone (matching the "Neural Core" aesthetic).

Output strictly the text of the briefing.`;

        const { text } = await generateText({
            model: openai("gpt-4-turbo"),
            prompt
        });

        return Response.json({ briefing: text, generatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Briefing generation error:", error);
        return Response.json(
            { error: "Failed to generate briefing" },
            { status: 500 }
        );
    }
}
