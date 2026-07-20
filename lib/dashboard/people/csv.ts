import { lc, nameFromEmail } from "./text";
import { tierNames, tierCad } from "./tiers";
import { contactEmails } from "./interactions";
import type { CrmDB } from "./types";

/** Port of parseCSV (crm.html:630). */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let i = 0, f = "", row: string[] = [], q = false;
  while (i < text.length) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else { if (ch === '"') q = true; else if (ch === ",") { row.push(f); f = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; } else f += ch; }
    i++;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/**
 * Pure port of importCSV transform (crm.html:631) with one deliberate deviation from the
 * original (review #36/#65): merging into an EXISTING contact only fills EMPTY fields and
 * matches by id as well as email, so a re-import can never clobber curated data or mint a
 * duplicate contact id. Returns a NEW db + counts; input untouched.
 */
export function importCsvInto(db: CrmDB, rows: string[][]): { db: CrmDB; added: number; updated: number } {
  if (rows.length < 2) return { db, added: 0, updated: 0 };
  const out: CrmDB = { ...db, contacts: db.contacts.map((c) => ({ ...c, tags: [...(c.tags || [])], emails: [...(c.emails || [])], log: (c.log || []).map((l) => ({ ...l })) })) };
  const hdr = rows[0].map((h) => lc(h));
  const idx = (n: string) => hdr.findIndex((h) => h === n || h.includes(n));
  const iName = idx("name"), iEmail = idx("email"), iPhone = idx("phone"), iTier = idx("tier"), iTags = idx("tag"), iNotes = idx("note"), iBday = idx("birth");
  let added = 0, updated = 0;
  for (let k = 1; k < rows.length; k++) {
    const row = rows[k]; if (!row.length || (row.length === 1 && !row[0])) continue;
    const email = iEmail >= 0 ? lc(row[iEmail] || "") : "";
    const name = (iName >= 0 ? row[iName] : "") || (email ? nameFromEmail(email) : "");
    if (!name && !email) continue;
    const id = email || name.toLowerCase() + "-" + Date.now() + "-" + k;
    const tags = iTags >= 0 ? String(row[iTags] || "").split(/[;|]/).map((t) => t.trim()).filter(Boolean) : [];
    const tier = iTier >= 0 && tierNames(out).includes(row[iTier]) ? row[iTier] : tierNames(out)[2] || tierNames(out)[0];
    // Match by email OR by id: a contact created from an email keeps id === that email even
    // after the address is edited away, so an id-only match is the same person (#65) —
    // mirrors ContactEditModal's id-merge guard and keeps contact ids unique.
    const existing = email ? out.contacts.find((x) => contactEmails(x).includes(email) || x.id === email) : null;
    if (existing) {
      // Merge = fill EMPTY fields only (#36). Curated name/phone/notes/birthday are never
      // overwritten by a re-import; tags and emails union as before.
      if (!existing.name && name) existing.name = name;
      if (email && !contactEmails(existing).includes(email)) existing.emails.push(email);
      if (!existing.phone && iPhone >= 0 && (row[iPhone] || "").trim()) existing.phone = (row[iPhone] || "").trim();
      existing.tags = [...new Set([...(existing.tags || []), ...tags])];
      if (!existing.notes && iNotes >= 0 && row[iNotes]) existing.notes = row[iNotes];
      if (!existing.birthday && iBday >= 0 && (row[iBday] || "").trim()) existing.birthday = (row[iBday] || "").trim();
      updated++;
    } else {
      out.contacts.push({ id, name, emails: email ? [email] : [], phone: iPhone >= 0 ? (row[iPhone] || "").trim() : "", tier, cadenceDays: tierCad(out, tier), tags, notes: iNotes >= 0 ? row[iNotes] || "" : "", birthday: iBday >= 0 ? (row[iBday] || "").trim() : "", howWeMet: "", log: [], lastTouch: null, snoozeUntil: null });
      added++;
    }
  }
  return { db: out, added, updated };
}
