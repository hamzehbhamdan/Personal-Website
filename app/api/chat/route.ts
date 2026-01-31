import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SupabaseClient } from "@supabase/supabase-js";
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const logFile = path.join(process.cwd(), 'debug-chat.log');
const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

// Tool execution functions for non-file-search tools
async function executeGetTasks(supabase: SupabaseClient, status?: string, limit?: number): Promise<string> {
    log("Executing getTasks");
    let query = supabase.from('tasks').select('*').limit(limit || 10).order('created_at', { ascending: false });
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) return `Error fetching tasks: ${error.message}`;
    return JSON.stringify(data);
}

async function executeGetContacts(supabase: SupabaseClient, search?: string, limit?: number): Promise<string> {
    log("Executing getContacts");
    let query = supabase.from('contacts').select('*').limit(limit || 5);
    if (search) {
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) return `Error fetching contacts: ${error.message}`;
    return JSON.stringify(data);
}

async function executeSearchSupabase(supabase: SupabaseClient, query: string, params: any): Promise<string> {
    log(`Executing Supabase search: ${query}`);
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
    } catch (e: any) {
        log(`Supabase search failed: ${e.message}`);
    }

    log(`Supabase search results: ${allResults.length}`);
    return allResults.join("\n\n");
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const { messages: inputMessages, params } = await req.json();
        log(`Request received. Messages: ${inputMessages.length}. ActiveStoreId: ${params?.activeStoreId || 'none'}`);

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
            log(`Using Responses API with file_search for store: ${params.activeStoreId}`);

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
                const errText = await responsesResponse.text();
                log(`Responses API error: ${errText}`);
                // Fall back to chat completions
            } else {
                const responsesData = await responsesResponse.json();
                log(`Responses API success: ${JSON.stringify(responsesData).substring(0, 200)}`);

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
                    log(`Final response from Responses API. Length: ${finalText.length}`);
                    return new Response(finalText, {
                        headers: { 'Content-Type': 'text/plain' }
                    });
                }
            }
        }

        // Fallback: Use Chat Completions API with manual tool handling
        log("Using Chat Completions API with manual tools");

        let conversationMessages = [...inputMessages];

        for (let step = 0; step < 5; step++) {
            log(`Step ${step + 1}: Calling LLM...`);

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
                const errText = await response.text();
                log(`OpenAI API error: ${errText}`);
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const completion = await response.json();
            const choice = completion.choices[0];
            const message = choice.message;

            log(`Step ${step + 1}: finish_reason=${choice.finish_reason}, tool_calls=${message.tool_calls?.length || 0}`);

            if (message.tool_calls && message.tool_calls.length > 0) {
                conversationMessages.push(message);

                for (const toolCall of message.tool_calls) {
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);

                    log(`Executing tool: ${toolName}`);
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
            log(`Final response generated. Length: ${finalText.length}`);

            return new Response(finalText, {
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        log("Max steps reached without final response");
        return new Response("I apologize, but I encountered an error processing your request. Please try again.", {
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error: any) {
        log(`Top level crash: ${error.message}`);
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
