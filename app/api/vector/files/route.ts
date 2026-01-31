import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        if (!storeId) return NextResponse.json({ error: "Store ID required" }, { status: 400 });

        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (!vsAPI) return NextResponse.json({ error: "OpenAI Vector Stores API not available." }, { status: 500 });

        // 1. Get files linked to the vector store
        const filesList = await vsAPI.files.list(storeId);
        const vectorFiles = filesList.data;

        // 2. Enrich with actual file details (filename, etc) from Files API
        const enrichedFiles = await Promise.all(vectorFiles.map(async (vf: any) => {
            try {
                const fileDetails = await openai.files.retrieve(vf.id);
                return {
                    ...vf,
                    filename: fileDetails.filename,
                    type: fileDetails.object,
                    bytes: fileDetails.bytes,
                    upload_status: fileDetails.status
                };
            } catch (e) {
                return { ...vf, filename: "Unknown File", bytes: 0, upload_status: 'unknown' };
            }
        }));

        return NextResponse.json(enrichedFiles);
    } catch (error: any) {
        console.error("Error fetching store files:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const fileId = searchParams.get("fileId");

        if (!storeId || !fileId) return NextResponse.json({ error: "Store ID and File ID required" }, { status: 400 });

        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (!vsAPI) {
            return NextResponse.json({ error: "OpenAI Vector Stores API not available." }, { status: 500 });
        }

        await vsAPI.files.del(storeId, fileId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log("API: POST /api/vector/files called");
    try {
        const formData = await req.formData();
        const files = formData.getAll("file") as File[];
        const storeId = formData.get("storeId") as string;

        if (!files || files.length === 0 || !storeId) {
            return NextResponse.json({ error: "Files and Store ID required" }, { status: 400 });
        }

        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (!vsAPI) return NextResponse.json({ error: "OpenAI API not available." }, { status: 500 });

        console.log(`API: Processing ${files.length} uploads for store ${storeId}...`);

        const uploadedFiles: any[] = [];

        await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 1. Upload to OpenAI Files
            const openaiFile = await openai.files.create({
                file: new File([buffer], file.name, { type: file.type }),
                purpose: "assistants",
            });

            // 2. Attach to Vector Store
            const vsFile = await vsAPI.files.create(storeId, {
                file_id: openaiFile.id
            });

            uploadedFiles.push({ ...vsFile, filename: file.name, bytes: openaiFile.bytes, status: 'uploaded' });
        }));

        console.log("API: All files processed successfully");
        return NextResponse.json({ success: true, count: uploadedFiles.length, files: uploadedFiles });
    } catch (error: any) {
        console.error("Error uploading files:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
