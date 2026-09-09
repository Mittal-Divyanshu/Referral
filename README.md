# ReferFlow

**Refer Friends. Earn Rewards.**

A referral management platform. Members get a unique referral link, share it, and
earn a ₹500 reward when someone they referred signs up and completes their
profile. Admins review and pay out those rewards.

> Status: **Phase 1 complete** — project skeleton, tooling and configuration. The
> database, authentication and referral engine land in later phases. See
> [Roadmap](#roadmap).

---

## Features

Planned for V1, built phase by phase:

- Email + password accounts with server-side sessions
- A unique, unguessable referral code per member
- Shareable referral links at `/r/CODE`, including WhatsApp sharing
- Click tracking and **30-day referral attribution** that survives the visitor
  leaving and coming back later
- Referral lifecycle: `CLICKED → REGISTERED → QUALIFIED → COMPLETED` (or
  `REJECTED`)
- Profile completion as the qualifying action
- Idempotent reward creation — exactly one ₹500 reward per referral
- Admin review queue: approve, reject, mark paid
- A full audit trail of every referral event

## Tech stack

| Layer      | Choice                             |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router) + React 19 |
| Language   | TypeScript (strict)                |
| Styling    | Tailwind CSS v4                    |
| Database   | PostgreSQL 18                      |
| ORM        | Prisma 7                           |
| Validation | Zod 4                              |
| Forms      | React Hook Form                    |
| Passwords  | bcryptjs                           |
| Unit tests | Vitest                             |
| E2E tests  | Playwright                         |
| Formatting | Prettier + ESLint                  |

**Why `bcryptjs` and not `bcrypt`?** `bcrypt` is a native addon that needs a C++
toolchain and frequently fails to install on Windows. `bcryptjs` implements the
same algorithm in pure JavaScript with no build step.

**Why no auth library?** Sessions are opaque random tokens stored in the
database. That is less code than configuring NextAuth, gives real server-side
logout and revocation, and the cookie carries no claims for an attacker to
tamper with.

## Architecture

Layered, so business rules are testable without a browser or a running server:

```
app/          Routes, pages and API handlers. HTTP and rendering only.
components/   Presentational React components. No business rules.
lib/
  env.ts      Environment config, validated once with Zod.
  auth/       Password hashing, sessions, authorization helpers.
  db/         Prisma client and data access.
  referrals/  Referral codes, click tracking, attribution, relationships.
  rewards/    Reward creation and the status state machine.
  validation/ Shared Zod schemas for request bodies and forms.
  utils/      Small generic helpers.
prisma/       schema.prisma and seed.ts
tests/unit/   Vitest tests for lib/ logic
tests/e2e/    Playwright tests for the full referral journey
docs/         Architecture notes
```

The rule that drives this: **a route handler validates input, calls one function
in `lib/`, and turns the result into a response.** Referral and reward rules live
in `lib/` where they can be unit tested directly.

See [`docs/architecture.md`](docs/architecture.md) for the referral lifecycle and
data model.

## Prerequisites

- **Node.js 24+** (`node --version`)
- **npm 11+**
- **PostgreSQL 16+** running locally

## Installation

```bash
npm install
```

Some dependencies ship install scripts that npm blocks by default, and Prisma
needs its scripts to download query engines. If you see an `allow-scripts`
warning:

```bash
npm install-scripts approve prisma @prisma/engines esbuild unrs-resolver
```

## PostgreSQL setup

Create the database (adjust the user to match your install):

```bash
createdb referflow
```

On Windows, `psql` and `createdb` are usually not on `PATH`. They live in the
PostgreSQL `bin` directory, for example `C:\Program Files\PostgreSQL\18\bin`.

## Environment variables

```bash
cp .env.example .env
```

Then edit `.env`. Generate a strong session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

| Variable                    | Required | Default | Purpose                                         |
| --------------------------- | -------- | ------- | ----------------------------------------------- |
| `DATABASE_URL`              | yes      | —       | PostgreSQL connection string                    |
| `SESSION_SECRET`            | yes      | —       | Signing secret, minimum 32 characters           |
| `APP_URL`                   | yes      | —       | Public origin; referral links are built from it |
| `REFERRAL_ATTRIBUTION_DAYS` | no       | `30`    | How long a click stays credited to the referrer |
| `REFERRAL_REWARD_AMOUNT`    | no       | `500`   | Reward per qualified referral, in whole rupees  |
| `REFERRAL_REWARD_CURRENCY`  | no       | `INR`   | ISO 4217 currency code                          |

`.env` is git-ignored and must never be committed. `.env.example` is the
committed template and contains no real secrets.

All of these are parsed and validated once in [`lib/env.ts`](lib/env.ts). A bad
or missing value fails at startup with a message naming every problem, instead of
causing a confusing error later.

## Development commands

```bash
npm run dev           # start the dev server on http://localhost:3000
npm run build         # production build
npm start             # serve the production build
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run lint:fix      # ESLint with autofix
npm run format        # Prettier write
npm run format:check  # Prettier check
npm run check         # typecheck + lint + format:check
```

## Database commands

> Available from Phase 2.

```bash
npx prisma migrate dev     # create and apply a migration
npx prisma generate        # regenerate the typed client
npx prisma studio          # browse the data
npx prisma db seed         # load demo data
```

## Testing commands

```bash
npm test              # Vitest unit tests
npm run test:watch    # Vitest in watch mode
npm run test:e2e      # Playwright end-to-end tests
```

Playwright needs its browser downloaded once:

```bash
npx playwright install chromium
```

## Demo accounts

> Available from Phase 2, once seeding is implemented.

## Roadmap

| Phase | Scope                                                        | Status  |
| ----- | ------------------------------------------------------------ | ------- |
| 1     | Project setup, tooling, environment config                   | ✅ done |
| 2     | Prisma schema, migrations, seed data                         | next    |
| 3     | Registration, login, logout, sessions, authorization         | —       |
| 4     | Referral codes, `/r/[code]`, click tracking, attribution     | —       |
| 5     | Profile completion, qualification, reward lifecycle          | —       |
| 6     | Dashboard, referrals page, profile page, sharing             | —       |
| 7     | Admin dashboard, referral and reward management              | —       |
| 8     | Unit tests, E2E tests, security review, database constraints | —       |
| 9     | Responsive polish, error handling, documentation             | —       |

## Security considerations

Implemented so far:

- Secrets come from environment variables, validated at startup
- `.env` is git-ignored; only a placeholder template is committed
- ESLint forbids reading `process.env` outside `lib/env.ts`, so no unvalidated
  configuration can creep back in
- ESLint forbids `any`, so unchecked values cannot spread silently

Planned in later phases: password hashing, server-side validation on every
endpoint, `HttpOnly` / `SameSite` session cookies, server-side authorization on
every protected route, and validated reward state transitions.

### Known advisories

`npm audit` reports high-severity advisories in `mysql2` and `deepmerge-ts`. Both
are transitive dependencies of the **Prisma CLI**, which is a `devDependency`. We
use PostgreSQL, so `mysql2` is never loaded, and neither package reaches the
production bundle. The advisories are only fixable by downgrading Prisma to v6,
which is a larger regression than the risk they carry here.

## Future improvements

- Multi-tier referrals and campaign-specific reward rules
- Richer fraud signals (velocity limits, disposable-email detection)
- Real payout integration instead of an admin marking rewards paid
- Email notifications on qualification and payout
- Rate limiting on authentication endpoints
