# Design — "Learn my voice" sample picker (voice sample wizard)

## Context

Sub-project C added an opt-in "learn my voice" flow: it reads the owner's **last 5** sent emails,
distills a reusable style summary via Claude, and (after the owner reviews) persists **only** the
summary + each sample's `{subject, date}` metadata — raw bodies are never stored. The reader is the
single sanctioned body-reading module `lib/gmail-read.ts` (`gmailRecentSent(token, 5)`), exposed via
`POST /api/gmail/sent-samples`, and surfaced by the "Your voice" section of `CrmSettingsModal`.

The owner wants control over **which** emails train the voice instead of a fixed "last 5": filter by
**recipient** and by **keyword/subject**, **hand-pick** specific messages from a browsable list (up to
**20**), in a **dedicated modal**. The recipient field **autocompletes from CRM contacts (Tab to
complete)**, and each browse row shows a **body snippet** for identification.

This is an enhancement of C's voice feature. It does **not** add a Google scope — it uses the
`gmail.readonly` scope C already introduced.

## Decisions locked (from the owner)

- **Filters:** recipient (`to:`) + keyword/subject search. (No date filter, no CRM-only filter.)
- **Selection:** hand-pick from a browsable list of matches (checkboxes).
- **Max samples per run:** **20** (server-enforced).
- **Placement:** a dedicated "Learn my voice" modal, opened from the Settings "Your voice" section.
- **Recipient autocomplete:** suggest CRM contacts as you type; **Tab** completes to the top match.
- **Snippet preview:** show Gmail's ~1-line `snippet` per browse row (display-only).

## Security principle (the crux)

**Browsing reads only headers + Gmail's short `snippet`; full message bodies are read only for the
emails the owner explicitly selects.** This is a *tightening* over today's "always read the last 5
bodies." Consequences, all preserved as invariants:

- Any function returning message body-derived content — including the `snippet` — lives ONLY in the
  sanctioned `lib/gmail-read.ts`. `lib/gmail.ts` stays strictly metadata/header-only and continues to
  ignore `snippet` (its guard test `test/people/gmail-metadata-guard.test.ts` stays green).
- Snippets are **display-only**: shown to the owner (their own sent mail) in their own session, never
  persisted and never sent to Claude.
- Full bodies (`format=full`) are read only for the ≤20 selected ids, sent to Claude **once** at
  distill time, wrapped in `DELIM`/`stripTagChars`, and **never persisted**. Approve stores only the
  `styleSummary` + selected `{subject, date}` metadata (unchanged from C).
- Both new routes: `requireUser(req)` (auth + single-user allow-list + same-origin/CSRF) → `allow(...)`
  rate-limit → request validation, before any Gmail call. No recipients/bodies/snippets logged.
- The owner-typed recipient/keyword are placed into the Gmail `q` param only (not a code-injection
  sink); they are still length-capped and newline-stripped as hygiene.

## Architecture

Data flow:
```
Filter inputs (recipient + keyword)
  → fetchSentSearch({ to, keyword, pageToken })
    → POST /api/gmail/sent-search  → gmailSearchSent()  [headers + snippet, no full body]
  → owner ticks up to 20 rows
  → fetchSentBodies(selectedIds)
    → POST /api/gmail/sent-bodies  → gmailFetchBodies() [format=full, selected only]
  → askAi("distill_voice", buildDistillPrompt(bodies))  → editable summary
  → Approve → persist styleSummary + selected {subject,date} (bodies discarded)
```

### Sanctioned reader — `lib/gmail-read.ts` (both new fns return body-derived content)
- `gmailSearchSent(token, { q, pageToken?, max? })`: `messages.list` on the query (`in:sent` is folded
  in by `buildSentQuery`, so `q` arrives complete), then per-id `messages.get(format=metadata,
  metadataHeaders=Subject,To,Date)`. Returns `{ messages: { id, subject, to, date, snippet }[],
  nextPageToken?: string }`. Page size ~25. Reuses the existing `header()` extraction helper (dedupe
  the copy noted in the C review). `snippet` comes from the metadata response.
- `gmailFetchBodies(token, ids[])`: `messages.get(format=full)` per id, reuse `extractPlainBody` +
  `cleanBody`. Returns `{ id, subject, date, body }[]`. Preserves order of `ids`; skips ids that fail.
- **Remove** `gmailRecentSent` (superseded).

### Pure logic — `lib/dashboard/people/gmail-schema.ts` (unit-tested first)
- `buildSentQuery({ to?, keyword? })`: returns the Gmail `q` string, always prefixed `in:sent`, adding
  `to:<value>` when `to` is set and the raw keyword terms when set. Caps each input (~120 chars),
  strips CR/LF and stray quotes. Pure.
- `parseSentSearchReq(body)`: validates optional `to` (string ≤120), optional `keyword` (string ≤120),
  optional `pageToken` (string ≤4096). Rejects non-object bodies. Returns a normalized `{ to, keyword,
  pageToken }`.
- `parseSentBodiesReq(body)`: validates `ids` is a non-empty array, length **≤ 20**, each element a
  string of sane length (≤256) — mirrors the `parseSendReq` validation style.

### Contact autocomplete — pure helper (unit-tested)
- `matchContacts(db, query, limit = 6)`: ranked `{ name, email }[]` whose name or primary email
  matches `query` (case-insensitive substring; empty query → []). Lives in
  `lib/dashboard/people/select.ts` next to the other pure selectors and reuses `contactEmails`.

### Routes
- `POST /api/gmail/sent-search`: `requireUser` → `allow(\`${userId}:gmail-sent-search\`, 15, 60_000)`
  → `parseSentSearchReq` (400) → `getGoogleAccessToken` (409) → `buildSentQuery` → `gmailSearchSent`
  → `{ messages, nextPageToken }`. 409 when not connected / scope missing.
- `POST /api/gmail/sent-bodies`: `requireUser` → `allow(\`${userId}:gmail-sent-bodies\`, 5, 60_000)`
  → `parseSentBodiesReq` (400, enforces ≤20) → `getGoogleAccessToken` (409) → `gmailFetchBodies`
  → `{ samples }`.
- **Remove** `app/api/gmail/sent-samples/route.ts`.

### Client — `lib/dashboard/people/client-ai.ts`
- `fetchSentSearch({ to, keyword, pageToken })` and `fetchSentBodies(ids)`; both check `r.ok` and
  distinguish **409** (→ "Reconnect Google to grant mail-reading access") from **429/5xx** (→ a
  transient "try again in a moment") — this also resolves C's deferred `fetchSentSamples` `r.ok` gap.
- **Remove** `fetchSentSamples`.

### UI — new `components/dashboard/people/LearnVoiceModal.tsx`
A `Modal` (nests cleanly under `CrmSettingsModal` now that Escape is topmost-only) with in-memory-only
state (`query`, `to`, `results`, `nextPageToken`, `selectedIds: Set`, `bodies`, `summary`, `busy`,
`msg`). Steps, top to bottom in one scrollable modal:
1. **Filter** — *Recipient* input with a CRM autocomplete dropdown (Tab/Enter/click completes to the
   top match's email; arrow keys move the highlight), *Keyword/subject* input, and **Search** (calls
   `fetchSentSearch`, replaces results and resets selection).
2. **Browse & pick** — rows of `subject · to · date` + the `snippet` (rendered as plain JSX text),
   each with a checkbox; a live "*n / 20 selected*" counter (disable further checks at 20); **Load
   more** appears when `nextPageToken` is set (appends the next page).
3. **Distill** — enabled for 1–20 selected → `fetchSentBodies(selected)` → `askAi("distill_voice",
   buildDistillPrompt(bodies))` → editable "Learned voice summary" textarea.
4. **Approve & save** — persists `styleSummary` + the selected rows' `{subject, date}` via the
   `setState((prev) => { const d = normalizeDb(prev); … })` convention (identical to C's `learnApprove`).
   Closing the modal discards `bodies` and all in-memory state.

### `CrmSettingsModal.tsx` changes
Replace the inline `learnFetch`/sample-list/`learnDistill`/`learnApprove` block in the "Your voice"
section with a single **"Learn my voice from sent mail…"** button that opens `LearnVoiceModal`. Keep:
the "A learned voice is currently saved…" status line and the **"Clear learned voice"** button
(`learnClear` stays). The distill/approve logic moves into the modal.

## Error handling
- Not connected / missing `gmail.readonly` scope → 409 on either route → modal shows "Reconnect Google
  to grant mail-reading access, then try again."
- Rate-limited (429) or 5xx → "Something went wrong — try again in a moment." (No false "reconnect".)
- Empty search → "No sent emails match that filter." Distill with 0 selected is disabled.
- `gmailFetchBodies` skips any id that fails; if all fail → surface a generic error, don't crash.

## Testing
- **Unit (new/extended, TZ=UTC):** `buildSentQuery` (in:sent prefix; to/keyword folding; caps + CRLF
  strip), `parseSentSearchReq` + `parseSentBodiesReq` (accept valid; reject non-array ids, >20 ids,
  overlong fields), `matchContacts` (name & email substring, ranking, empty query → []). Extend the
  metadata-only guard to assert the new snippet/body reads are only in `lib/gmail-read.ts`. Replace the
  existing `test/people/gmail-read.test.ts` cases for `gmailRecentSent` with cases covering
  `gmailSearchSent` (query passthrough, headers+snippet mapping, `nextPageToken`) and `gmailFetchBodies`
  (selected-only bodies, order preserved, failed-id skip).
- **Guard:** `gmail-no-send.test.ts` unchanged (no new send path); `gmail-metadata-guard.test.ts` still
  passes (lib/gmail.ts snippet-free).
- **Live:** filter by a recipient (with Tab autocomplete), keyword-search, Load more, pick a few,
  Distill, edit, Approve; confirm via `/api/state` that only `styleSummary` + `{subject,date}` persist
  (no bodies/snippets); 409 path when scope missing.

## Removed / retired
`app/api/gmail/sent-samples/route.ts`, `gmailRecentSent` (lib/gmail-read.ts), `fetchSentSamples`
(client-ai.ts), and the inline learn-voice fetch/list/distill UI in `CrmSettingsModal` — all superseded
by the wizard (a no-filter search covers the old "recent" case).

## Isolation & units
- Reader (`gmail-read.ts`): "given a token + query/ids, return sent-mail headers+snippet / full bodies."
- Validators + `buildSentQuery` (`gmail-schema.ts`): pure request-shaping/validation, no I/O.
- `matchContacts`: pure ranking over `db.contacts`.
- Routes: thin auth+rate-limit+validate wrappers over the reader.
- `LearnVoiceModal`: self-contained wizard; its only outward writes are the passed `setState` (approve)
  and the two client fetchers; raw bodies never leave its memory.

## Out of scope (future)
Date-range filter, CRM-only quick filter, snippet-less "strict" mode, auto-refresh of the learned
voice, multi-account senders.
