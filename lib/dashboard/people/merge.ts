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

/**
 * Decide whether a contact should end up a member of one manual group after Save, given its
 * membership before the save (`wasIn`), whether the add/edit form has that group checked
 * (`checked`), and whether this save is a merge (the add form collided with an existing contact,
 * per findContactClash).
 *
 * On a merge, `checked` comes from the add form's `checkedGroups`, which starts EMPTY in add
 * mode (it's only seeded from an existing contact in edit mode). Treating it as authoritative
 * would silently strip the existing contact from every manual group it already belonged to —
 * contradicting the merge confirm dialog's promise that "existing details are kept, only empty
 * fields are filled in". So on merge, membership can only be ADDED by `checked`, never removed:
 * the result is `wasIn OR checked`. Non-merge add (no collision) and edit are unaffected —
 * `checked` alone decides, so unchecking a group in edit mode still removes it, exactly as before.
 * Pure — no side effects.
 */
export function resolveGroupMembership(wasIn: boolean, checked: boolean, mergeMode: boolean): boolean {
  return mergeMode ? (wasIn || checked) : checked;
}
