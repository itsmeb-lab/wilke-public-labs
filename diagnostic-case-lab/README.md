# One-issue software diagnostic: reproducible case and fulfillment kit

This is a public, synthetic case and a reusable delivery process for the [Wilke Service Co. $150 one-issue diagnostic](https://wilkeservices.com/software-diagnostic). It is not a customer result, a production deployment, or a claim that any paid job has occurred.

## Run the proof

- In a modern browser, serve the repository root over HTTP and open diagnostic-case-lab/index.html.
- Run the pure Node checks from the repository root with: `npm test`.
- For independent headless visual/receipt QA, run `npm run verify:browser -- --out-dir <private-existing-or-new-receipt-folder>`. This uses an already-installed Chrome/Edge via Node's built-in CDP interface, starts a short-lived loopback server and isolated browser profile, captures 320px/390px screenshots, checks 1280px too, and intercepts the synthetic JSON download into a unique run subfolder under the chosen folder. The same run now checks keyboard Tab order, visible focus, Enter/Space activation, inspectable receipt summary and reduced-motion CSS, in addition to responsive layout and exact download completion. No Playwright package, login, browser-profile reuse, customer data or external request is required; the script fails closed if checks fail. These focused checks do not replace an independent human screen-reader audit. Do not put any real customer details in the fixture.
- Open the case, choose **False success**, **Truthful failure**, and **Verified record**. The transport is HTTP 200 in each fixture; the application and saved-reference evidence decide what can be truthfully claimed.
- Download the JSON receipt. It contains a synthetic case identifier, the chosen fixture, exact trace and acceptance results. If the browser blocks downloads, expand **Inspect the exact synthetic JSON receipt** to read the same data on-page. A download click does not guarantee a file was saved. No request is sent to an API, database or inbox.

The code is intentionally narrow. It does not test a live email provider, customer storage, credentials, real network conditions, deployment, legal compliance or security certification.

## Delivery kit

Use these together; the website's email composer is an inquiry preparer, not an order:

1. [Intake template](./INTAKE_TEMPLATE.md) — qualify one issue without collecting secrets.
2. [Scope, schedule and delivery runbook](./DELIVERY_RUNBOOK.md) — agree access, timing, commercial terms and decision gates in writing.
3. [Acceptance checklist](./ACCEPTANCE_CHECKLIST.md) — evidence completeness and explicit buyer sign-off.
4. [Synthetic sample handoff](./SAMPLE_HANDOFF.md) — model the distinction between observed fact, inference and unknown.
5. [Customer message drafts](./CUSTOMER_MESSAGES.md) — editable templates for qualification, scope confirmation, delivery and clarification.
6. [Customer scope packet](./CUSTOMER_SCOPE_PACKET.md) — blank one-issue, permission, timeline, $150 terms and affirmative written approval form, not an executed agreement.
7. [Customer diagnostic report template](./REPORT_TEMPLATE.md) — explicit evidence ledger, unknowns, repair recommendation and acceptance choices; never a paid-client sample.
8. [Pure engagement gate assessor](./engagement-gates.mjs) — optional, offline decision aid with fail-closed tests; it neither verifies a customer's reply or processor payment nor takes action.

## Live inquiry acceptance check (not a lead)

Use `npm run verify:inquiry -- --out-dir <private-receipt-directory>` only when a fresh source acceptance check is needed. It opens the existing live offer in an isolated installed Chrome/Edge with an exact-allowlist of read-only first-party GET requests. It uses only SYN-API-001 fictional fields in the client-side composer; it never opens an email application, transmits a customer inquiry, charges, or invokes a checkout. The JSON receipt distinguishes usable prepared/copy fallback from a received message, and flags whether allowed referral tags survive into the email draft.

See [the conversion acceptance contract](./INQUIRY_CONVERSION_ACCEPTANCE.md) for current source-level findings, privacy and consent boundaries, and the separate site-owner and merchant release gates. A prepared brief and a passing browser test are **not** a real visitor, received lead or payment.

## One-issue boundary

Included: one agreed JavaScript/Node.js API, webhook, or lead-form failure; authorized safe reproduction when feasible; focused tests; concise repair decision; written report; one clarification. Not included: a new product, full architecture/security audit, production implementation, recurring support, incident recovery guarantee, account verification or third-party spend.

No work begins until both sides have confirmed scope, authorized environment, access method, timetable and payment terms. No credentials, private records or unsanitized logs belong in this public repository or the inquiry email. Keep Upwork-originated relationships, pre-contract discussion and payments on Upwork.

## Evidence and business truth

The original teaching fixture deliberately models a bad UI that says "Sent" after HTTP 200 despite a rejected save. The guarded comparison does not fix any real system. The confirmed fixture proves only a simulated saved row, **not** recipient delivery. Every customer engagement requires its own consent and actual evidence. The live page currently has no checkout; do not describe a draft invoice, a payment link, or a synthetic test as a sale.
