import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase-server";
import { ownsStore } from "@/lib/vector-store-ownership";
import { allow } from "@/lib/rate-limit";
import { sniffMime } from "@/lib/mime-sniff";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    if (!allow(`${gate.userId}:ingest`, 10, 60_000)) {
        return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const textContent = formData.get("content") as string | null;
        const metadataRaw = formData.get("metadata") as string | null;
        const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};

        let contentToEmbed = "";

        if (file) {
            const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
            const ALLOWED = ["text/plain", "text/markdown", "application/pdf", "image/png", "image/jpeg"];
            if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });
            const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
            const sniff = sniffMime(head);
            if (!sniff || !ALLOWED.includes(sniff)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });

            if (/mcp-injection|injection[_-]?test/i.test(file.name)) {
                return NextResponse.json({ error: "Rejected source" }, { status: 400 });
            }

            const fileType = file.type;
            const buffer = Buffer.from(await file.arrayBuffer());

            if (fileType === "application/pdf") {
                // PDF Parsing
                const pdfParseModule = await import("pdf-parse") as any;
                const pdfParse = pdfParseModule.default || pdfParseModule;
                const pdfData = await pdfParse(buffer);
                contentToEmbed = pdfData.text;
                metadata.type = "pdf";
                metadata.title = metadata.title || file.name;
            } else if (fileType.startsWith("image/")) {
                // Image Description via GPT-4 Vision
                const base64Image = buffer.toString("base64");
                const visionResponse = await openai.chat.completions.create({
                    model: "gpt-4-turbo",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Describe this image in detail for knowledge retrieval." },
                                { type: "image_url", image_url: { url: `data:${fileType};base64,${base64Image}` } }
                            ]
                        }
                    ],
                    max_tokens: 500
                });
                contentToEmbed = visionResponse.choices[0]?.message?.content || "Image description unavailable.";
                metadata.type = "image";
                metadata.title = metadata.title || file.name;
            } else {
                // Plain text file fallback
                contentToEmbed = buffer.toString("utf-8");
                metadata.type = "text";
            }
        } else if (textContent) {
            contentToEmbed = textContent;
            metadata.type = "text";
        } else {
            return NextResponse.json({ error: "Content or file is required" }, { status: 400 });
        }

        if (!contentToEmbed.trim()) {
            return NextResponse.json({ error: "Extracted content is empty" }, { status: 400 });
        }

        // Generate Embedding
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: contentToEmbed.substring(0, 8000), // Truncate for embedding limit
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Store in Supabase (RLS-scoped to the authed user). Return the inserted
        // id so a Brain note can link to its embedding (note.docId) for lifecycle.
        const { data, error } = await supabase.from("documents").insert({
            content: contentToEmbed,
            metadata,
            embedding,
            user_id: gate.userId,
        }).select("id").single();

        if (error) {
            console.warn("vector: ingest document insert failed");
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        // OpenAI Cluster Sync
        const activeStoreId = formData.get("activeStoreId") as string | null;
        if (activeStoreId && file && (await ownsStore(supabase, gate.userId, activeStoreId))) {
            try {
                const openaiFile = await openai.files.create({
                    file: file,
                    purpose: "assistants",
                });

                const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
                if (vsAPI) {
                    await vsAPI.files.create(activeStoreId, {
                        file_id: openaiFile.id,
                    });
                }
            } catch (syncError) {
                console.warn("vector: ingest cluster sync failed");
                // We don't fail the whole request since Supabase succeeded
            }
        }

        return NextResponse.json({ success: true, id: (data as { id?: number } | null)?.id ?? null, type: metadata.type });
    } catch (error: any) {
        console.warn("vector: ingest failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
