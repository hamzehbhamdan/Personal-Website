"use client";

import { useState } from "react";
import { Card, Segmented } from "@/components/dashboard/ui";
import { PersonRow } from "./PersonRow";
import { SuggestedList } from "./SuggestedList";
import { state } from "@/lib/dashboard/people/state";
import { allTags, filterSortContacts } from "@/lib/dashboard/people/select";
import type { PeopleFilter } from "@/lib/dashboard/people/select";
import { tierNames } from "@/lib/dashboard/people/tiers";
import { buildSuggestions } from "@/lib/dashboard/people/suggestions";
import type { CrmDB, Contact } from "@/lib/dashboard/people/types";
import type { LiveState } from "./useLiveInteractions";

type Mode = "contacts" | "suggested";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const selectCls =
  "rounded-[8px] border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] text-stone-600 outline-none focus:border-[#A51C30]";

export function PeopleList({ db, live, now, onOpenContact, onAdd, onDismiss }: {
  db: CrmDB;
  live: LiveState;
  now: Date;
  onOpenContact: (id: string) => void;
  onAdd: (email: string) => void;
  onDismiss: (email: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("contacts");
  const [filter, setFilter] = useState<PeopleFilter>({ tier: "all", tag: "all", sort: "overdue", q: "" });

  const stateOf = (c: Contact) => state(c, live.gmail, live.cal, db, now);
  const list = filterSortContacts(db, stateOf, filter);
  const suggCount = buildSuggestions(db, live.gmail, live.cal).length;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <select
          className={selectCls}
          style={mono}
          value={filter.tier}
          onChange={(e) => setFilter((f) => ({ ...f, tier: e.target.value }))}
        >
          <option value="all">All tiers</option>
          {tierNames(db).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={selectCls}
          style={mono}
          value={filter.tag}
          onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}
        >
          <option value="all">All tags</option>
          {allTags(db).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className={selectCls}
          style={mono}
          value={filter.sort}
          onChange={(e) => setFilter((f) => ({ ...f, sort: e.target.value as PeopleFilter["sort"] }))}
        >
          <option value="overdue">Sort: most overdue</option>
          <option value="recent">Sort: recently contacted</option>
          <option value="name">Sort: name</option>
        </select>
        <input
          value={filter.q}
          onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search…"
          className="min-w-[140px] flex-1 rounded-[8px] border border-stone-200 bg-white px-3 py-1.5 text-[13px] text-stone-900 outline-none placeholder:text-stone-300 focus:border-[#A51C30]"
        />
        <Segmented
          options={[
            { value: "contacts" as Mode, label: "Contacts" },
            { value: "suggested" as Mode, label: `Suggested (${suggCount})` },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      {mode === "contacts" ? (
        list.length === 0 ? (
          <div className="py-2 text-[13px] text-stone-500">No contacts match. Add someone, or check Suggested.</div>
        ) : (
          <div className="[&>*:last-child]:border-b-0">
            {list.map(({ c, s }) => (
              <PersonRow key={c.id} contact={c} s={s} onClick={() => onOpenContact(c.id)} />
            ))}
          </div>
        )
      ) : (
        <SuggestedList db={db} live={live} onAdd={onAdd} onDismiss={onDismiss} />
      )}
    </Card>
  );
}
