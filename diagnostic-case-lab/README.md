# One-issue software diagnostic: reproducible case and fulfillment kit

This is a public, synthetic case and a reusable delivery process for the [Wilke Service Co. $150 one-issue diagnostic](https://wilkeservices.com/software-diagnostic). It is not a customer result, a production deployment, or a claim that any paid job has occurred.

## Run the proof

- In a modern browser, serve the repository root over HTTP and open diagnostic-case-lab/index.html.
- Or run the pure Node checks from the repository root with: npm test.
- Open the case, choose **False success**, **Truthful failure**, and **Verified record**. The transport is HTTP 200 in each fixture; the application and saved-reference evidence decide what can be truthfully claimed.
- Download the JSON receipt. It contains a synthetic case identifier, the chosen fixture, exact trace and acceptance results. No request is sent to an API, database or inbox.

The code is intentionally narrow. It does not test a live email provider, customer storage, credentials, real network conditions, deployment, legal compliance or security certification.

## Delivery kit

Use these together; the website's email composer is an inquiry preparer, not an order:

1. [Intake template](./INTAKE_TEMPLATE.md) — qualify one issue without collecting secrets.
2. [Scope, schedule and delivery runbook](./DELIVERY_RUNBOOK.md) — agree access, timing, commercial terms and decision gates in writing.
3. [Acceptance checklist](./ACCEPTANCE_CHECKLIST.md) — evidence completeness and explicit buyer sign-off.
4. [Synthetic sample handoff](./SAMPLE_HANDOFF.md) — model the distinction between observed fact, inference and unknown.
5. [Customer message drafts](./CUSTOMER_MESSAGES.md) — editable templates for qualification, scope confirmation, delivery and clarification.

## One-issue boundary

Included: one agreed JavaScript/Node.js API, webhook, or lead-form failure; authorized safe reproduction when feasible; focused tests; concise repair decision; written report; one clarification. Not included: a new product, full architecture/security audit, production implementation, recurring support, incident recovery guarantee, account verification or third-party spend.

No work begins until both sides have confirmed scope, authorized environment, access method, timetable and payment terms. No credentials, private records or unsanitized logs belong in this public repository or the inquiry email. Keep Upwork-originated relationships, pre-contract discussion and payments on Upwork.

## Evidence and business truth

The original teaching fixture deliberately models a bad UI that says "Sent" after HTTP 200 despite a rejected save. The guarded comparison does not fix any real system. The confirmed fixture proves only a simulated saved row, **not** recipient delivery. Every customer engagement requires its own consent and actual evidence. The live page currently has no checkout; do not describe a draft invoice, a payment link, or a synthetic test as a sale.
