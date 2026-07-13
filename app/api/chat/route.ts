import { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

async function executeSearchSupabase(supabase: SupabaseClient, query: string, params: any): Promise<string> {
    let allResults: string[] = [];

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
                match_count: params?.retrievalCount || 5,
            });
            if (documents) {
                documents.forEach((d: any) => {
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
        const { messages: inputMessages, params } = await req.json();

        const systemPrompt = `You are Hamzeh's Advanced Personal OS Assistant.
You have direct access to his Second Brain (notes), Tasks (Directives), Contacts (Network), and Calendar.

Always check the Second Brain for context first if the query is about knowledge or past notes.
Use the Tasks and Contacts tools to retrieve specific data when asked.

If you cannot find information, admit it nicely.
Be concise, professional, and slightly futuristic in tone.`;

        // Build tools array - file_search if vector store is connected, plus custom tools
        const tools: any[] = [
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
        if (params?.activeStoreId) {
            // Build input for Responses API
            const inputContent = inputMessages[inputMessages.length - 1]?.content || "";

            const responsesResponse = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4-turbo",
                    input: inputContent,
                    instructions: systemPrompt,
                    tools: [
                        {
                            type: "file_search",
                            vector_store_ids: [params.activeStoreId]
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
        let conversationMessages = [...inputMessages];

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
                            toolResult = await executeSearchSupabase(supabase, toolArgs.query, params);
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
