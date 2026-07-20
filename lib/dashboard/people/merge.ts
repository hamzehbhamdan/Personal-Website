import { lc } from "./text";
import type { Contact } from "./types";

/** Fields the "Add contact" form can supply for a new/merged contact. */
export interface IncomingContact {
  name: string;
  emails: string[];
  phone: string;
  tier: string;
  cadenceDays: number;
  birthday: string;
  howWeMet: string;
  tags: string[];
  notes: string;
  avatarImg: string | null;
}

/**
 * Find an existing contact that collides with a not-yet-created id/email set: matched by id OR
 * by any shared email (case-insensitive). Mirrors importCsvInto's match rule (#65) so the
 * "Add contact" collision guard and CSV import agree on what counts as "the same person".
 * Pure — does not read/write anything outside its arguments.
 */
export function findContactClash(contacts: Contact[], id: string, emails: string[]): Contact | undefined {
  const wanted = emails.map(lc);
  return contacts.find((x) => x.id === id || x.emails.some((e) => wanted.includes(lc(e))));
}

/**
 * Fill-empty merge (#36/#57): the existing contact's curated field values always win; only
 * blank/empty fields get filled from the incoming form values. Emails and tags union. This is
 * the same rule importCsvInto (lib/dashboard/people/csv.ts) applies on a re-import match, so
 * "Add contact" colliding with an existing contact behaves identically to re-importing that
 * contact's row from a CSV. Pure — returns a new Contact, mutates neither argument.
 */
export function mergeContactFillEmpty(existing: Contact, incoming: IncomingContact): Contact {
  return {
    id: existing.id,
    name: existing.name || incoming.name,
    emails: [...new Set([...existing.emails.map(lc), ...incoming.emails.map(lc)])],
    phone: existing.phone || incoming.phone,
    tier: existing.tier,
    cadenceDays: existing.cadenceDays,
    birthday: existing.birthday || incoming.birthday,
    howWeMet: existing.howWeMet || incoming.howWeMet,
    tags: [...new Set([...(existing.tags || []), ...incoming.tags])],
    notes: existing.notes || incoming.notes,
    avatarImg: existing.avatarImg ?? incoming.avatarImg,
    log: existing.log,
    lastTouch: existing.lastTouch,
    snoozeUntil: existing.snoozeUntil,
  };
}
