import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { parseAiRequest } from "@/lib/dashboard/ai-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Safety contract (enforced by callers in B/C): this route only returns text. It
// performs no side effects. Any action that sends/writes (Gmail draft, etc.) is a
// separate route requiring explicit human confirmation. Retrieved/email content
// passed in `prompt` is treated as untrusted data, delimited by the caller.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:ai`, 30, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseAiRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: parsed.value.system ?? "You are a concise, warm assistant. Return only the requested text.",
      messages: [{ role: "user", content: parsed.value.prompt }],
    });
    const text = msg.content.filter((c) => c.type === "text").map((c: any) => c.text).join("").trim();
    return Response.json({ text });
  } catch {
    console.warn("ai: generation failed");
    return Response.json({ error: "AI unavailable" }, { status: 502 });
  }
}
