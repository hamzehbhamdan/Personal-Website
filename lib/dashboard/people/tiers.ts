// lib/dashboard/people/tiers.ts
import type { CrmDB, Tier } from "./types";
export const DEFAULT_TIERS: Tier[] = [
  { name: "Inner circle", cadenceDays: 21, color: "#bf6129" },
  { name: "Family", cadenceDays: 30, color: "#9c4a2f" },
  { name: "Friends", cadenceDays: 60, color: "#6d7740" },
  { name: "Mentors", cadenceDays: 120, color: "#7d6ba0" },
  { name: "Professional", cadenceDays: 180, color: "#5f6f7a" },
];
export const PALETTE = ["#6d7740","#bf6129","#9c4a2f","#7d6ba0","#5f6f7a","#a8863a","#4f5d39","#8a6d4b"];

export const tierNames = (db: Pick<CrmDB, "tiers">) => db.tiers.map((t) => t.name);
export const tierCad = (db: Pick<CrmDB, "tiers">, n: string) => db.tiers.find((t) => t.name === n)?.cadenceDays ?? 90;
export const tierColor = (db: Pick<CrmDB, "tiers">, n: string) => db.tiers.find((t) => t.name === n)?.color ?? "#8c8472";

export interface TierRow { orig: string; name: string; cad: number; }
/** Pure port of saveTiers (crm.html:614-624): rebuild tiers, migrate contact.tier + smart tier-rules. */
export function migrateTiers(db: CrmDB, rows: TierRow[]): CrmDB {
  const newTiers: Tier[] = [];
  const renames: [string, string][] = [];
  rows.forEach((r, i) => {
    const name = r.name.trim(); if (!name) return;
    const oldColor = db.tiers.find((t) => t.name === r.orig)?.color;
    newTiers.push({ name, cadenceDays: r.cad || 90, color: oldColor || PALETTE[i % PALETTE.length] });
    if (r.orig && r.orig !== name) renames.push([r.orig, name]);
  });
  if (!newTiers.length) return db;
  const names = newTiers.map((t) => t.name), fb = names[0];
  const rn = (v: string) => { const hit = renames.find((x) => x[0] === v); return hit ? hit[1] : v; };
  const contacts = db.contacts.map((c) => {
    let tier = rn(c.tier); if (!names.includes(tier)) tier = fb;
    return tier === c.tier ? c : { ...c, tier };
  });
  const groups = db.groups.map((g) => {
    if (g.type !== "smart" || !g.rule || g.rule.kind !== "tier" || g.rule.value == null) return g;
    let value = rn(g.rule.value); if (!names.includes(value)) value = fb;
    return value === g.rule.value ? g : { ...g, rule: { ...g.rule, value } };
  });
  return { ...db, tiers: newTiers, contacts, groups };
}
