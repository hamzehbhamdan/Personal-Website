// lib/dashboard/people/isPerson.ts
import { lc, isMine } from "./text";

// Substring badwords: reject if the local-part CONTAINS any of these. Verbatim from
// crm.html:215 — the entries that were written WITHOUT a trailing "@".
export const BADWORDS = ["noreply","no-reply","donotreply","do-not-reply","notification","notifications","newsletter","mailer","mailer-daemon","bounce","no_reply","support","billing","receipt","receipts","invoice","updates","alert","alerts","notify","service","digest","marketing","promo","offers","do_not_reply","automated","postmaster"];

// Role local-parts: reject only when the local-part EQUALS one of these. In crm.html these
// were written as "info@","team@",… but its lp.includes(w) test could never match them (the
// "@" is the delimiter), so role addresses like info@company.com were silently NOT filtered
// — a latent artifact bug. We fix it with exact-match (not substring) so info@/team@/… are
// filtered WITHOUT regressing real people whose local-part merely contains the word
// (e.g. ismail@, newsome@, emailytran@).
export const BADWORDS_ROLE_EXACT = ["news","info","team","hello","shop","sales","update","reply","email","mail","contact","admin","help","members","community"];

export const BADDOMAIN_SUB = ["substack.com","stackcommerce.com","cityexperiences.com","mailchimp","sendgrid","intercom","salesforce","marketo","constantcontact","mailgun","sparkpost","hubspot","klaviyo"];
export const MKT_PREFIX = ["em","mg","e","t","mail","mailer","news","newsletter","click","send","reply","info","marketing","email","notifications","noreply","no-reply","update","updates","alerts","notify"];

export function isPerson(email: string): boolean {
  const e = lc(email);
  if (!e || !e.includes("@")) return false;
  if (isMine(e)) return false;
  const [lp, dom = ""] = e.split("@");
  if (!dom.includes(".")) return false;
  if (BADWORDS.some((w) => lp.includes(w))) return false;
  if (BADWORDS_ROLE_EXACT.includes(lp)) return false;
  if (BADDOMAIN_SUB.some((d) => dom.includes(d))) return false;
  if (dom.includes("calendar.google.com") || dom.includes("group.calendar")) return false;
  const labels = dom.split(".");
  if (labels.length >= 3 && MKT_PREFIX.includes(labels[0])) return false;
  if (/^[0-9a-f]{16,}$/.test(lp)) return false;
  if (lp.length < 2) return false;
  return true;
}
