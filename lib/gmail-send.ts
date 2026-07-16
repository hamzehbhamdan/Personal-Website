// lib/gmail-send.ts
// SANCTIONED send path — the ONLY file that SENDS mail. Reverses the never-send invariant.
// Security-reviewed separately; kept OUT of the no-send CI guard's FILES list (lib/gmail.ts, the
// draft route, and the search route stay strictly send-free). Never logs recipients.
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Send a previously-created draft by id (drafts.send). Never logs recipients. Returns null on failure. */
export async function gmailSendDraft(token: string, draftId: string): Promise<{ id: string } | null> {
  try {
    const r = await fetch(`${API}/drafts/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: draftId }),
    });
    if (!r.ok) { console.warn("gmail-send: send failed", r.status); return null; }
    const j = await r.json();
    return { id: j.id };
  } catch { console.warn("gmail-send: send error"); return null; }
}
