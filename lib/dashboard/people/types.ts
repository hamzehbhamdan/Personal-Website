export interface Tier { name: string; cadenceDays: number; color: string; }

export interface LogEntry { date: string; type: string; note: string; }

export interface Contact {
  id: string;
  name: string;
  emails: string[];
  phone?: string;
  tier: string;
  cadenceDays?: number;
  birthday?: string;        // "MM-DD"
  howWeMet?: string;
  tags: string[];
  notes?: string;
  avatarImg?: string | null;
  lastTouch: string | null; // ISO; the ONLY derived field persisted
  snoozeUntil: string | null;
  log: LogEntry[];
}

export type GroupType = "manual" | "smart";
export type RuleKind = "all" | "tier" | "tag" | "overdue";
export interface SmartRule { kind: RuleKind; value: string | null; }

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  rule: SmartRule | null;
  members: string[];        // contact ids (manual; smart keeps last-computed for edit)
  notes?: string;
  cadenceDays: number | null;
  lastTouch: string | null;
  snoozeUntil: string | null;
  avatarImg?: string | null;
}

export interface CrmSettings { autoTags: boolean; }

export interface CrmDB {
  version: number;
  contacts: Contact[];
  groups: Group[];
  dismissed: string[];
  tiers: Tier[];
  settings: CrmSettings;
}

// ---- live (never persisted) interaction maps ----
export interface GmailMsg { date: string; dir: "in" | "out"; subject: string; }
export interface GmailEntry { last: string | null; lastDir: "in" | "out" | null; count: number; msgs: GmailMsg[]; }
export type GmailMap = Record<string, GmailEntry>;

export interface CalEvent { date: string; summary: string; }
export interface CalEntry { lastPast: string | null; next: string | null; events: CalEvent[]; }
export type CalMap = Record<string, CalEntry>;

// ---- computed ----
export interface ContactState {
  last: string | null; days: number | null; cad: number;
  overdue: boolean; soon: boolean; snoozed: boolean; oweReply: boolean;
  calNext: string | null; bdayIn: number | null;
}
export interface GroupStateResult { cad: number | null; days: number | null; overdue: boolean; snoozed: boolean; }
export type InteractionKind = "email" | "event" | "log";
export interface Interaction { type: InteractionKind; date: string; dir?: "in" | "out"; logType?: string; text: string; }
export interface Suggestion { email: string; score: number; last: string | null; }

// Raw header row returned by /api/gmail/search (subjects only, NO bodies/snippets)
export interface GmailHeaderRow {
  from: string; to: string[]; date: string; subject: string; mailbox: "sent" | "inbox";
}
// Normalized calendar event from /api/calendar/events
export interface CalendarEvent {
  summary: string; start: string; end?: string;
  attendees: { email: string; self?: boolean }[];
}
