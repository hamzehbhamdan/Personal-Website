import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
    console.log("API: GET /api/vector/stores called");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';
        console.log("API: GET/stores acting as user:", userId);

        // 1. Fetch user's store mappings from Supabase
        const { data: mappings, error: dbError } = await supabase
            .from('user_vector_stores')
            .select('vector_store_id')
            .eq('user_id', userId);

        console.log(`API: Found ${mappings?.length || 0} mappings in Supabase`);
        if (dbError) {
            console.error("Supabase GET error:", dbError);
            return NextResponse.json({ error: `Supabase Error: ${dbError.message}` }, { status: 500 });
        }

        if (!mappings || mappings.length === 0) return NextResponse.json([]);

        const userStoreIds = mappings.map(m => m.vector_store_id);

        // 2. Fetch all from OpenAI and filter
        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (!vsAPI) {
            console.error("Vector Stores API not found on client or beta namespace");
            return NextResponse.json({ error: "OpenAI Vector Stores API not available in this SDK version." }, { status: 500 });
        }

        const vectorStoresList = await vsAPI.list();
        console.log(`API: OpenAI returned ${vectorStoresList.data.length} total stores`);
        const filteredStores = vectorStoresList.data.filter((s: any) => userStoreIds.includes(s.id));
        console.log(`API: Returning ${filteredStores.length} stores after filtering`);

        return NextResponse.json(filteredStores);
    } catch (error: any) {
        console.error("Error fetching OpenAI vector stores:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log("API: POST /api/vector/stores called");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';
        console.log("API: POST/stores acting as user:", userId);

        const { name } = await req.json();

        // 1. Create in OpenAI
        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (!vsAPI) {
            console.error("Vector Stores API not found on client or beta namespace");
            return NextResponse.json({ error: "OpenAI Vector Stores API not available in this SDK version." }, { status: 500 });
        }

        const vectorStore = await vsAPI.create({
            name: name || "New Cognitive Cluster",
        });
        console.log("API: OpenAI store created:", vectorStore.id);

        // 2. Link in Supabase
        const { error: dbError } = await supabase.from('user_vector_stores').insert({
            user_id: userId,
            vector_store_id: vectorStore.id
        });

        if (dbError) {
            console.error("API: Supabase mapping error:", dbError);
            return NextResponse.json({ error: `Supabase Error: ${dbError.message}` }, { status: 500 });
        }
        console.log("API: Supabase mapping created successfully");

        return NextResponse.json(vectorStore);
    } catch (error: any) {
        console.error("Error creating OpenAI vector store:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';

        // 1. Delete from OpenAI
        // 1. Delete from OpenAI
        // 1. Delete from OpenAI
        const vsAPI = (openai as any).vectorStores || (openai.beta as any)?.vectorStores;
        if (vsAPI) {
            await vsAPI.del(id);
        }

        // 2. Delete from Supabase mapping
        const { error: dbError } = await supabase.from('user_vector_stores')
            .delete()
            .eq('user_id', userId)
            .eq('vector_store_id', id);

        if (dbError) {
            console.error("Supabase DELETE error:", dbError);
            return NextResponse.json({ error: `Supabase Error: ${dbError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting OpenAI vector store:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
