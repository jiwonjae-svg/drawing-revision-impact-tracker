# DrawingFlow

DrawingFlow is a portfolio-grade **Drawing Revision Impact Tracker** for ship design and manufacturing DX workflows. It controls a drawing change from draft through independent review, approved issue, production acknowledgement, and closure.

> **Data disclaimer:** every project, drawing number, person, work package, status event, and audit record in this repository is synthetic. No employer, customer, vessel, or production drawing data is included.

## Why this project exists

Drawing revisions do not affect a drawing alone. They can change fabrication sequence, work-package readiness, interfaces, material decisions, inspection scope, and delivery risk. DrawingFlow makes those downstream effects visible before an approved revision reaches production.

## Controlled workflow

```text
Draft -> In Review -> Approved -> Issued -> Closed
             |                         |
             +----> Draft              +--> Production acknowledgement required
```

Release gates:

- A draft requires a change summary and at least one impact item before review.
- High and critical revisions require a responsible owner and mitigation plan.
- A creator cannot approve their own revision.
- Issue requires an approval record and effective date.
- Closure requires a production acknowledgement.
- Every mutation writes an audit event in the same transaction; a PostgreSQL trigger rejects later updates or deletes.

## Product surface

- Command dashboard for pending review, overdue control work, and open risk
- Drawing register with search, filter, sort, detail history, and CSV export
- Revision creation with downstream impact registration
- Role-aware review, approval, rejection, issue, acknowledgement, and close actions
- Risk-ordered review queue
- Revision-level evidence timeline and global audit trail
- Project-scoped memberships and role authorization on reads and mutations
- Validated CSV drawing-register import with batch-level error evidence
- Typed REST PDM adapter boundary with upstream response validation
- Durable notification outbox with webhook delivery and retry state
- Read-only workflow, security posture, and role capability matrix

## Demo roles

All demo accounts use `Demo123!`.

| Role | Account | Primary capability |
|---|---|---|
| Designer | `designer@drawingflow.demo` | Create and submit revisions |
| Reviewer | `reviewer@drawingflow.demo` | Approve, return, and issue |
| Production | `production@drawingflow.demo` | Acknowledge and close |
| Admin | `admin@drawingflow.demo` | Manage the full workflow |
| Viewer | `viewer@drawingflow.demo` | Read-only inspection |

## Architecture

- **UI:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Data:** PostgreSQL 16, Prisma 7 with PostgreSQL driver adapter
- **Authentication:** Auth.js credentials flow with bcrypt/JWT plus optional approved-member Google or GitHub SSO
- **Authorization:** Project membership and project-specific roles applied in the data-access and mutation layers
- **Validation:** Zod plus `csv-parse` for bounded, row-level import validation
- **Integration:** Transactional import batches, typed REST PDM contract, and webhook notification outbox
- **Testing:** Vitest for workflow, export, CSV, and PDM rules; Playwright for multi-role, project isolation, import, and responsive flows

The application uses a server-only data access layer under `src/data`. Every server action authenticates the caller, checks project membership and role, validates input, reevaluates the workflow gate, and writes its data change, audit event, and notification event in one database transaction.

## Local setup

Prerequisites: Node.js 20+, npm, Docker Desktop, and Chrome.

```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev -- -p 3200
```

Open `http://127.0.0.1:3200`.

## Verification

```bash
npm run lint
npm test
npm run test:db
npm run build
npm run test:e2e
```

The project uses Webpack for Next.js development and production builds because the current Turbopack release has a Windows Unicode-path panic when the repository lives below a Korean-named directory.

## Production deployment

Use a managed PostgreSQL database and set:

```text
DATABASE_URL=postgresql://...
AUTH_SECRET=<strong-random-secret>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_NAME=DrawingFlow
NOTIFICATION_WEBHOOK_URL=https://...
```

Run `prisma migrate deploy` during release. Optional Google or GitHub SSO is activated only when its client ID and secret are present, and only pre-approved member emails are accepted. Credentials remain enabled for the public role-based portfolio walkthrough.

## Known boundaries

- This MVP tracks impact metadata rather than storing confidential CAD files.
- The REST PDM adapter is a tested integration contract; no proprietary PDM endpoint or CAD binary is connected.
- Webhook delivery is implemented, but remains queued when `NOTIFICATION_WEBHOOK_URL` is absent.
- A production owner should additionally configure retention policy, database roles, secret rotation, alerting, and organization-specific SSO.
- ERP work-package synchronization and CAD-file preview are future work and are not claimed as implemented.
