import { requireUser } from "@/lib/supabase-server";
import { getGoogleAccessToken } from "@/lib/google";

export const dynamic = "force-dynamic";

interface GoogleCalendarAttendee {
  email?: string;
  self?: boolean;
}

interface GoogleCalendarEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: GoogleCalendarAttendee[];
}

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, events: [] });
  const u = new URL(req.url);
  const timeMin = u.searchParams.get("timeMin") ?? new Date(Date.now() - 365 * 864e5).toISOString();
  const timeMax = u.searchParams.get("timeMax") ?? new Date(Date.now() + 90 * 864e5).toISOString();
  const api = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  api.search = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250" }).toString();
  try {
    const r = await fetch(api, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) { console.warn("calendar: fetch failed"); return Response.json({ connected: true, events: [] }); }
    const j: unknown = await r.json();
    const itemsRaw = (j as { items?: unknown })?.items;
    const items: GoogleCalendarEvent[] = Array.isArray(itemsRaw) ? itemsRaw : [];
    const events = items.map((e) => ({
      summary: e.summary ?? "(busy)",
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      attendees: (Array.isArray(e.attendees) ? e.attendees : []).map((a) => ({ email: a?.email, self: !!a?.self })),
    }));
    return Response.json({ connected: true, events });
  } catch {
    console.warn("calendar: fetch error");
    return Response.json({ connected: true, events: [] });
  }
}
