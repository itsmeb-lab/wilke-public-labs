# Offline diagnostic report workflow — operator instructions

This is a **working report-production tool**, not a sales sample or a customer receipt. It converts an explicitly **sanitized** one-issue evidence input into a printable HTML report, a hash-bearing manifest and a separate delivery/acceptance checklist. It creates files locally and never contacts a buyer, API, inbox or merchant.

## First run: prove the engine with fictional evidence

From the repository root, run with a **new private destination outside this Git repo**:

```powershell
npm run build:handoff -- --input diagnostic-case-lab/fixtures/synthetic-false-success.json --out-dir C:\dev\_ops_receipts\my-unique-handoff-test
```

Outputs are `report.html`, `manifest.json` and `delivery-checklist.md`. The fictional case is labeled `SYNTHETIC TEACHING REPORT · NOT A CLIENT CASE`. The claim audit detects HTTP 200 + rejected application + zero saved records + a misleading Sent message. Recipient delivery stays **not tested**. No production database, inbox or customer has been examined.

The builder and the browser verifier resolve Windows junctions and symbolic links before accepting a path. Use a private destination whose resolved location is outside the public checkout.

For independent installed-Chrome rendering, run `npm run verify:handoff -- --report <private-output>/report.html --out-dir <private-receipt-root>`. The offline-only CDP check compares the HTML hash to the manifest, checks 320px/390px/1280px layouts, keyboard focus and no external requests, then prints an actual PDF and writes PNG/JSON receipts. It neither opens the real inquiry nor sends a report.

## Real one-issue job, after the actual approvals

1. **Qualify and agree:** use `CUSTOMER_SCOPE_PACKET.md`, `DELIVERY_RUNBOOK.md` and `engagement-gates.mjs`. Record a real authorized system owner, exact one-issue scope, environment/test permissions, delivery target, one clarification, cancellation/refund/tax/payment terms and separate founder-approved payment route. A draft cannot prove the approval.
2. **Collect privately:** obtain sanitized, source-referenced evidence from the agreed secure channel. Never paste raw logs, keys, names, email addresses, phone numbers or personal records into public repository files. Keep actual real-client input files **outside** this repository. Use an exact private version of the `wilke-one-issue-report-input-v1` schema (see fictional fixture for field names), and set `classification` to `sanitized-private`.
3. **Verify independent evidence:** check `transport`, `application`, `persistence`, `ui` and `recipient` separately against the authorized source. Each fact must reference its distinct evidence row. A reported HTTP status is **not** proof of saved data; a save is **not** proof of recipient delivery. Mark untested stages as such. The generator checks consistency, but it **cannot authenticate** external system events or source identity.
4. **Generate once, privately:** `npm run build:handoff -- --input <private-sanitized-json> --out-dir <new-private-directory>`. The tool refuses repo-contained output and existing destination directories. It performs a conservative pattern scan for obvious emails, keys and secrets, escapes untrusted text into a static HTML document, and records SHA256 of the normalized input and exact HTML bytes. Pattern scanning is incomplete: a human still must inspect the entire document for privacy, confidentiality, copyright and evidence accuracy.
5. **Review and deliver:** open `report.html` locally, inspect on mobile and print, independently review each source reference, and approve the exact file hash before transmitting via the **customer-approved private channel**. The tool will not send, invoice or charge. Only after a real send, record the actual channel and message/attachment ID externally; do **not** change a sample manifest to claim delivery.
6. **Close with explicit customer decision:** ask the designated reviewer to acknowledge the *written diagnostic report* as accepted, request the one included clarification, or specify a dispute. Silence is never acceptance. Separate payment settlement from report acceptance and repair outcomes. Follow retention/deletion terms in the agreed private records system.

## Evidence confidence rule — reviewer-facing acceptance

A matching evidence reference is **not itself** proof of an observed event. The audit now uses both `facts` and the corresponding row's `state`, and the printable HTTP/application summary visibly qualifies secondhand claims.

| Evidence state | Meaning in this operator-supplied report | Permitted claim audit |
| --- | --- | --- |
| `observed` | Operator says they directly inspected the referenced stage | May support a bounded result if the stage, fact and matching reference are consistent; independent source verification is **still required** |
| `reported` | A secondhand statement or uncorroborated status | May be displayed as `reported, not observed`; **cannot** alone certify a saved record, a proven contradiction, recipient receipt or observed HTTP acceptance |
| `not_tested` or `unknown` | There is no direct observation to support a concrete result | A concrete HTTP/application/persistence/UI assertion is **rejected at input validation**; keep its fact unknown or obtain authorized evidence |

- **Positive saved result:** only `application: accepted` and `persistence: saved` with a saved reference **and observed matching application/persistence evidence** can produce the bounded `SAVED RECORD PROVEN IN SUPPLIED EVIDENCE` verdict.
- **Confirmed false success:** the UI success claim must be observed, and the rejected application or unsaved persistence must be observed. Otherwise `UNVERIFIED SUCCESS CLAIM` applies.
- **Recipient receipt:** remains a separate observed and reference-matched claim. Neither it nor a saved record proves actual delivery or payment independently.
- **Authority boundary:** operators can lie about `observed`. This tool checks consistency, **not authenticity**; customer delivery requires human source-system readback and authorization, and no report may be promoted as a real client result without those gates.

## Release and safety contract

- **Public sample and private draft are not sales:** both are watermarked as not delivered, not paid and not accepted, including in print. A `sanitized-private` input still requires real approvals before any customer delivery.
- **No side effects:** Node built-ins only; no HTTP clients, external packages, forms, email, checkout, Stripe/Square, or production POST. No customer PII belongs in fixtures or version control.
- **Not evidence authentication:** a forged `observed` flag or receipt reference can pass structural validation. The operator must independently verify source records and owner permission; the manifest always sets `independentSourceVerification=false`.
- **Source-owner gate:** the case lab and builder currently live only in the unmerged Public Labs PR. Merge/Pages publication requires independent source review and owner authorization. This offline generator neither authorizes nor performs either step.

If an input fails validation, treat it as a real **stop**, correct the sanitized evidence, and generate to a fresh directory. Do not bypass the source, privacy or payment gates to make a report appear complete.
