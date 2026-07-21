import { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/supabase-server";
import { ownsStore } from "@/lib/vector-store-ownership";
import { allow } from "@/lib/rate-limit";
import { parseChatRequest } from "@/lib/dashboard/ai-schema";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Minimal shape of an OpenAI Chat Completions "function" tool definition —
// only what this route actually builds/sends.
interface ChatCompletionToolDef {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, { type: string; enum?: string[]; description?: string }>;
            required?: string[];
        };
    };
}

// Tool execution functions for non-file-search tools
async function executeGetTasks(supabase: SupabaseClient, status?: string, limit?: number): Promise<string> {
    let query = supabase.from('tasks').select('*').limit(limit || 10).order('created_at', { ascending: false });
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return `Error fetching tasks: ${error.message}`;
    return JSON.stringify(data);
}

async function executeGetContacts(supabase: SupabaseClient, search?: string, limit?: number): Promise<string> {
    let query = supabase.from('contacts').select('*').limit(limit || 5);
    if (search) {
        const safe = search.replace(/[,()%\\]/g, " ").trim();
        if (safe) query = query.or(`name.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error) return `Error fetching contacts: ${error.message}`;
    return JSON.stringify(data);
}

interface MatchedDocument {
    content: string;
    metadata?: { title?: string } | null;
}

async function executeSearchSupabase(supabase: SupabaseClient, query: string, retrievalCount: number): Promise<string> {
    const allResults: string[] = [];

    try {
        const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: query,
            }),
        });
        const embeddingData = await embeddingResponse.json();

        if (embeddingData.data) {
            const queryEmbedding = embeddingData.data[0].embedding;
            const { data: documents } = await supabase.rpc("match_documents", {
                query_embedding: queryEmbedding,
                match_threshold: 0.5,
                match_count: retrievalCount,
            });
            if (documents) {
                (documents as MatchedDocument[]).forEach((d) => {
                    allResults.push(`[Neural Node: ${d.metadata?.title || "Note"}]\n${d.content}`);
                });
            }
        }
    } catch {
        console.warn("chat: supabase search failed");
    }

    return allResults.join("\n\n");
}

export async function POST(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    if (!allow(`${gate.userId}:chat`, 30, 60_000)) {
        return Response.json({ error: "Rate limited" }, { status: 429 });
    }
    try {
        // Ingress validation (report #14): 400 on malformed JSON / bad shape,
        // whitelist user|assistant roles, cap count + total chars, clamp retrievalCount.
        const body: unknown = await req.json().catch(() => null);
        const parsed = parseChatRequest(body);
        if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
        const { messages: inputMessages, retrievalCount, activeStoreId } = parsed.value;

        const systemPrompt = `You are Hamzeh's Advanced Personal OS Assistant.
You have direct access to his Second Brain (notes), Tasks (Directives), Contacts (Network), and Calendar.

Always check the Second Brain for context first if the query is about knowledge or past notes.
Use the Tasks and Contacts tools to retrieve specific data when asked.

If you cannot find information, admit it nicely.
Be concise, professional, and slightly futuristic in tone.`;

        // Build tools array - file_search if vector store is connected, plus custom tools
        const tools: ChatCompletionToolDef[] = [
            {
                type: "function",
                function: {
                    name: "getTasks",
                    description: "Get the user's current tasks (directives).",
                    parameters: {
                        type: "object",
                        properties: {
                            status: { type: "string", enum: ["todo", "in-progress", "done", "all"], description: "Filter by status" },
                            limit: { type: "number", description: "Maximum number of tasks to return" }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "getContacts",
                    description: "Search or list contacts from the network.",
                    parameters: {
                        type: "object",
                        properties: {
                            search: { type: "string", description: "Search term for name or company" },
                            limit: { type: "number", description: "Maximum number of contacts to return" }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "searchLocalNodes",
                    description: "Search local Supabase neural nodes for notes and documents.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string", description: "The search query" }
                        },
                        required: ["query"]
                    }
                }
            }
        ];

        // If vector store is connected, use OpenAI Responses API with file_search
        if (activeStoreId && await ownsStore(supabase, gate.userId, activeStoreId)) {
            // Pass the FULL conversation (not just the last turn) so follow-ups keep context.
            const responsesInput = inputMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const responsesResponse = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4-turbo",
                    input: responsesInput,
                    instructions: systemPrompt,
                    tools: [
                        {
                            type: "file_search",
                            vector_store_ids: [activeStoreId]
                        }
                    ]
                })
            });

            if (!responsesResponse.ok) {
                console.warn("chat: responses api error");
                // Fall back to chat completions
            } else {
                const responsesData = await responsesResponse.json();

                // Extract the text output from responses
                let finalText = "";
                if (responsesData.output) {
                    for (const item of responsesData.output) {
                        if (item.type === "message" && item.content) {
                            for (const content of item.content) {
                                if (content.type === "output_text") {
                                    finalText += content.text;
                                }
                            }
                        }
                    }
                }

                if (finalText) {
                    return new Response(finalText, {
                        headers: { 'Content-Type': 'text/plain' }
                    });
                }
            }
        }

        // Fallback: Use Chat Completions API with manual tool handling
        // Internal loop state: starts from validated ingress, then legitimately
        // accumulates assistant tool-call messages and role:"tool" results.
        const conversationMessages: unknown[] = [...inputMessages];

        for (let step = 0; step < 5; step++) {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4-turbo",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...conversationMessages
                    ],
                    tools: tools,
                    tool_choice: "auto"
                })
            });

            if (!response.ok) {
                console.warn("chat: openai api error");
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const completion = await response.json();
            const choice = completion.choices[0];
            const message = choice.message;

            if (message.tool_calls && message.tool_calls.length > 0) {
                conversationMessages.push(message);

                for (const toolCall of message.tool_calls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);

                    let toolResult = "";

                    switch (toolName) {
                        case "getTasks":
                            toolResult = await executeGetTasks(supabase, toolArgs.status, toolArgs.limit);
                            break;
                        case "getContacts":
                            toolResult = await executeGetContacts(supabase, toolArgs.search, toolArgs.limit);
                            break;
                        case "searchLocalNodes":
                            toolResult = await executeSearchSupabase(supabase, toolArgs.query, retrievalCount);
                            break;
                        default:
                            toolResult = `Unknown tool: ${toolName}`;
                    }

                    conversationMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: toolResult || "No results found."
                    });
                }

                continue;
            }

            const finalText = message.content || "";

            return new Response(finalText, {
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        return new Response("I apologize, but I encountered an error processing your request. Please try again.", {
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch {
        console.warn("chat: request failed");
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
