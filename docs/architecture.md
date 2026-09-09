# ReferFlow Architecture

This document explains how ReferFlow is put together and, more importantly, _why_
it is put together that way. It grows as each phase lands.

> Current state: **Phase 1**. The layering and configuration described in
> [Layering](#layering) and [Configuration](#configuration) exist today. The data
> model in [The referral lifecycle](#the-referral-lifecycle) is the design that
> Phase 2 will implement.

---

## Layering

The single most important structural decision: **HTTP, business rules, and data
access are three separate layers.**

```
┌──────────────────────────────────────────────┐
│  app/          routes, pages, API handlers   │  ← knows about HTTP & React
├──────────────────────────────────────────────┤
│  lib/          referral & reward rules       │  ← knows about neither
├──────────────────────────────────────────────┤
│  lib/db/       Prisma client                 │  ← knows about the database
└──────────────────────────────────────────────┘
```

A route handler does exactly three things:

1. Parse and validate the request with a Zod schema.
2. Call one function in `lib/`.
3. Turn the result into a response with an appropriate status code.

Why bother? Because the interesting logic in this app — _"does this click still
count?"_, _"has this referral already been rewarded?"_, _"is this reward
transition legal?"_ — is where the bugs live. Keeping it out of route handlers
and React components means it can be unit tested directly, with no server, no
browser and no HTTP.

The corollary rule: **components never contain business rules.** A component may
format a status badge; it may not decide whether a referral qualifies.

## Configuration

Every environment variable is declared, parsed and validated exactly once, in
[`lib/env.ts`](../lib/env.ts), using a Zod schema. The module exports a typed
`env` object.

This matters for two reasons:

- **Fail fast, fail clearly.** A missing `DATABASE_URL` or a too-short
  `SESSION_SECRET` stops the process at startup with a message listing every
  problem at once. The alternative — `process.env.DATABASE_URL` typed as
  `string | undefined` — turns a configuration mistake into a confusing runtime
  error somewhere much later.
- **No unvalidated config anywhere else.** An ESLint rule forbids reading
  `process.env` outside `lib/env.ts`, so this cannot be quietly bypassed.

Two values in here are business policy rather than plumbing, and deliberately
configurable:

- `REFERRAL_ATTRIBUTION_DAYS` (default `30`) — the attribution window.
- `REFERRAL_REWARD_AMOUNT` (default `500`) — the reward per qualified referral.

## The referral lifecycle

This is the core of the product. One referral moves through these states:

```
  visitor opens /r/DVX82K9
            │
            ▼
      ┌───────────┐   attribution cookie set, ReferralClick row written
      │  CLICKED  │
      └─────┬─────┘
            │  visitor registers within the attribution window
            ▼
      ┌────────────┐  Referral row links referrer → referred user
      │ REGISTERED │
      └─────┬──────┘
            │  referred user completes their profile
            ▼
      ┌───────────┐   exactly one PENDING ₹500 Reward is created
      │ QUALIFIED │
      └─────┬─────┘
            │  reward reaches PAID
            ▼
      ┌───────────┐
      │ COMPLETED │
      └───────────┘

  At any point an admin may move a referral to REJECTED.
```

And the reward runs its own state machine alongside it:

```
  PENDING ──approve──▶ APPROVED ──pay──▶ PAID
     │
     └───reject───▶ REJECTED
```

Transitions are validated server-side. `PENDING → PAID` skips review, so it is
rejected; `REJECTED → APPROVED` is rejected; and re-approving an already
`APPROVED` reward is rejected. Hiding a button in the UI is not a control — the
check lives on the server.

## Why attribution is the hard part

The naive implementation credits a referrer only when someone clicks a link and
registers in the same visit. Real people do not behave that way. They click a
link on Monday, close the tab, and sign up on Thursday.

So attribution has to be **durable and server-side**:

1. A visit to `/r/CODE` validates the code against the database. A code that
   does not exist is never trusted just because it appeared in a URL.
2. The server writes a `ReferralClick` row and sets an opaque, `HttpOnly`
   attribution cookie.
3. The cookie contains a random identifier — **not** the referral code itself.
   The referrer is looked up server-side from that identifier, so a visitor
   cannot edit a cookie to credit an arbitrary person.
4. At registration the server resolves the attribution, checks it is still
   inside the window, and persists the relationship in PostgreSQL. From that
   moment the cookie is irrelevant; the database is the record.

Point 3 is the reason for the `sessionId` column on `ReferralClick`. It is what
keeps engineering rule _"never trust referral codes supplied by the client"_
true in practice.

## Why rewards must be idempotent

Reward creation is triggered by a user action (completing a profile) that can
easily happen more than once — a double-clicked submit button, a retried
request, a page refresh. Paying ₹500 twice for one referral is a real financial
bug, not a cosmetic one.

Two defences, deliberately layered:

- **A unique constraint** on `Reward.referralId`. Even a perfectly timed
  concurrent double-submit ends with one row, because the database refuses the
  second.
- **A transaction** wrapping the status change and the reward insert, so a
  referral can never be marked `QUALIFIED` without its reward existing, or vice
  versa.

The constraint is the one that actually guarantees correctness. Application-level
"check then insert" logic has a race window between the check and the insert; a
unique index does not.

## The audit trail

`ReferralEvent` records every meaningful thing that happens to a referral:
`REFERRAL_CLICKED`, `USER_REGISTERED`, `REFERRAL_QUALIFIED`, `REWARD_CREATED`,
`REWARD_APPROVED`, `REWARD_REJECTED`, `REWARD_PAID`.

The state columns on `Referral` and `Reward` tell you _where a referral is now_.
The event table tells you _how it got there_. When an admin needs to judge
whether a referral is fraudulent, or a member disputes a missing reward, the
current state alone is not enough to answer the question.

## Privacy notes

The click tracking table stores the minimum needed to make attribution and basic
abuse detection work. Raw IP addresses are deliberately **not** stored: they are
personal data, and every question we actually need to answer in V1 can be
answered without them. If IP-based abuse detection is added later, it should
store a salted hash rather than the address itself.

## Deferred to later phases

Recorded here so the reasoning is not lost:

- **Rate limiting** on authentication and referral endpoints. Correct
  implementation needs shared state across instances (Redis or similar), which is
  out of scope for a single-node V1.
- **Device fingerprinting** for fraud detection. Explicitly out of scope; the
  `ReferralEvent` table is the extension point when it is needed.
- **Real payouts.** An admin marking a reward `PAID` records an intent, not a
  bank transfer.
