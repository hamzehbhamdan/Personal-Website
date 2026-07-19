import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/supabase-server";
import { ownsStore } from "@/lib/vector-store-ownership";
import { allow } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
    const gate = await requireUser();
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    if (!allow(`${userId}:vector-stores`, 60, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    try {
        // 1. Fetch user's store mappings from Supabase
        const { data: mappings, error: dbError } = await supabase
            .from('user_vector_stores')
            .select('vector_store_id')
            .eq('user_id', userId);

        if (dbError) {
            console.warn("vector: stores GET mapping query failed");
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        if (!mappings || mappings.length === 0) return NextResponse.json([]);

        const userStoreIds = mappings.map(m => m.vector_store_id);

        // 2. Fetch all from OpenAI and filter
        const vectorStoresList = await openai.vectorStores.list();
        const filteredStores = vectorStoresList.data.filter((s) => userStoreIds.includes(s.id));

        return NextResponse.json(filteredStores);
    } catch (error: any) {
        console.warn("vector: stores GET failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    if (!allow(`${userId}:vector-stores`, 30, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    try {
        const { name } = await req.json();

        // 1. Create in OpenAI
        const vectorStore = await openai.vectorStores.create({
            name: name || "New Cognitive Cluster",
        });

        // 2. Link in Supabase
        const { error: dbError } = await supabase.from('user_vector_stores').insert({
            user_id: userId,
            vector_store_id: vectorStore.id
        });

        if (dbError) {
            console.warn("vector: stores POST mapping insert failed");
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        return NextResponse.json(vectorStore);
    } catch (error: any) {
        console.warn("vector: stores POST failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;
    const supabase = gate.supabase;
    const userId = gate.userId;
    if (!allow(`${userId}:vector-stores`, 30, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Verify the caller owns this store before touching OpenAI (prevents IDOR).
        if (!(await ownsStore(supabase, userId, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // 1. Delete from OpenAI. 404 = already gone remotely; still clean up
        //    the mapping row so the UI stops listing a ghost store.
        try {
            await openai.vectorStores.delete(id);
        } catch (err) {
            if ((err as { status?: number })?.status !== 404) throw err;
        }

        // 2. Delete from Supabase mapping
        const { error: dbError } = await supabase.from('user_vector_stores')
            .delete()
            .eq('user_id', userId)
            .eq('vector_store_id', id);

        if (dbError) {
            console.warn("vector: stores DELETE mapping delete failed");
            return NextResponse.json({ error: "Server error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.warn("vector: stores DELETE failed");
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
