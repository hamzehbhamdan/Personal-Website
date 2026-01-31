import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import OpenAI from "openai";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const textContent = formData.get("content") as string | null;
        const metadataRaw = formData.get("metadata") as string | null;
        const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};

        let contentToEmbed = "";

        if (file) {
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

        // Store in Supabase
        const { data, error } = await supabase.from("documents").insert({
            content: contentToEmbed,
            metadata,
            embedding,
        });

        if (error) throw error;

        // OpenAI Cluster Sync
        const activeStoreId = formData.get("activeStoreId") as string | null;
        if (activeStoreId && file) {
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
                console.log(`Synced file ${openaiFile.id} to cluster ${activeStoreId}`);
            } catch (syncError) {
                console.error("OpenAI Cluster Sync Error:", syncError);
                // We don't fail the whole request since Supabase succeeded
            }
        }

        return NextResponse.json({ success: true, data, type: metadata.type });
    } catch (error: any) {
        console.error("Vector Ingest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
