# DrawingFlow two-minute walkthrough

## Before recording

- Open the live demo in a desktop viewport near 1440 x 900.
- Keep the shared demo password visible only on the login page.
- Use synthetic accounts and records only.
- Start as Designer, then switch to Reviewer and Production when describing separation of duties.

## 0:00-0:20 — Operational problem

Open the command dashboard.

> A drawing revision can affect fabrication, work-package readiness, interfaces, material, inspection, and schedule. DrawingFlow keeps those downstream effects visible and controlled before release.

Point to the review queue, open risks, overdue controls, workflow distribution, and recent audit activity.

## 0:20-0:45 — Register and change definition

Open the drawing register and select a drawing with a high or critical revision.

> The register is searchable and exportable. Each revision records why the drawing changed, who owns the control, its effective date, and the affected downstream work.

On the revision page, point to the workflow strip, impact table, mitigation, due date, and responsible owner.

## 0:45-1:15 — Release gates and role separation

Explain the path `Draft -> In review -> Approved -> Issued -> Closed`.

> Submission requires a change summary and impact evidence. High-risk changes require ownership and mitigation. The creator cannot approve their own revision. Issue requires independent approval and an effective date; closure requires production acknowledgement.

Switch roles if demonstrating live actions. Do not perform every transition when time is limited; the existing evidence timeline shows the complete record.

## 1:15-1:40 — Audit and integrations

Open the audit trail, then Integrations.

> Every mutation writes an audit event in the same transaction. A PostgreSQL trigger rejects later updates or deletes. CSV imports are validated and recorded as batches. The PDM boundary validates bounded metadata pages before they enter the core workflow.

Point to the notification outbox and explain that workflow events are committed before delivery, then marked sent or retried.

## 1:40-2:00 — Honest boundary and value

> This is an independent portfolio case study using synthetic data, not an employer production system. CAD files and proprietary PDM endpoints are intentionally outside the MVP. The project demonstrates how my ship-design experience translates into traceable DX controls implemented with TypeScript, Next.js, PostgreSQL, automated tests, and deployable integration boundaries.

Close on the live revision evidence page rather than the login screen.
