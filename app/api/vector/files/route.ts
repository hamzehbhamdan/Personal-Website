import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/supabase-server";
import { ownsStore } from "@/lib/vector-store-ownership";
import { allow } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    if (!allow(`${userId}:vector-files`, 60, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        if (!storeId) return NextResponse.json({ error: "Store ID required" }, { status: 400 });

        // Verify the caller owns this store before touching OpenAI.
        if (!(await ownsStore(supabase, userId, storeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // 1. Get files linked to the vector store
        const filesList = await openai.vectorStores.files.list(storeId);
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
        console.warn("vector: files GET failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    try {
        if (!allow(`${userId}:vector-files`, 60, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const fileId = searchParams.get("fileId");

        if (!storeId || !fileId) return NextResponse.json({ error: "Store ID and File ID required" }, { status: 400 });

        // Verify the caller owns this store before touching OpenAI.
        if (!(await ownsStore(supabase, userId, storeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // v6 signature: delete(fileID, { vector_store_id }). 404-tolerant so an
        // already-detached file doesn't strand the UI.
        try {
            await openai.vectorStores.files.delete(fileId, { vector_store_id: storeId });
        } catch (err) {
            if ((err as { status?: number })?.status !== 404) throw err;
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.warn("vector: files DELETE failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    try {
        if (!allow(`${userId}:vector-files`, 30, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
        const formData = await req.formData();
        const files = formData.getAll("file") as File[];
        const storeId = formData.get("storeId") as string;

        if (!files || files.length === 0 || !storeId) {
            return NextResponse.json({ error: "Files and Store ID required" }, { status: 400 });
        }

        // Verify the caller owns this store before touching OpenAI.
        if (!(await ownsStore(supabase, userId, storeId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
            const vsFile = await openai.vectorStores.files.create(storeId, {
                file_id: openaiFile.id
            });

            uploadedFiles.push({ ...vsFile, filename: file.name, bytes: openaiFile.bytes, status: 'uploaded' });
        }));

        return NextResponse.json({ success: true, count: uploadedFiles.length, files: uploadedFiles });
    } catch (error: any) {
        console.warn("vector: files POST failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
