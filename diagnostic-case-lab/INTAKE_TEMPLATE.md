# Diagnostic intake — one issue only

Use this after an inquiry. Fill with non-sensitive summaries; do not request passwords, tokens, customer details, complete production logs or private repository access in email. Mark unknown items as unknown.

- **Request reference:** [DIAG-YYYYMMDD-###]
- **Contact / organization:** [Customer to supply through approved channel]
- **Platform relationship:** [Direct / Upwork / other; if Upwork, continue there]
- **Requested diagnostic:** [API / webhook / lead form]
- **Runtime and framework:** [e.g., Node 22 / Express, versions when known]
- **Issue in one sentence:** [One reproducible or precisely described problem]

## Expected versus actual

- Trigger: [What action or event starts the flow?]
- Expected result: [What record, response or notification should exist, and where?]
- Actual result: [What is observed, without inferring a cause?]
- First observed: [Approximate date/time, timezone]
- Frequency: [Every time / intermittent / unknown]
- Business impact: [Qualitative, no private record details]
- Safe reproduction steps: [Use only agreed synthetic data and authorized test systems]
- Most relevant response, status or event ID: [Sanitized only]
- Resulting record or receiving-owner evidence: [Exists / absent / not checked]
- Recent changes or retries: [Relevant version or change summary]
- What has already been tried: [Avoid repeating destructive tests]

## Access and permission

- Authorized owner of the system/data: [Name/role confirmed in writing]
- Permitted environment: [Local fixture / staging / production read-only, exact boundaries]
- Approved test window and limits: [Time window, rate cap, side-effect policy]
- Permitted artifacts: [Redacted code snippets, sanitized event sample, fixture]
- Safe transfer method: [Agreed secure channel; never submit secrets via page composer]
- Backup/rollback owner if any change is later separately ordered: [Not part of diagnosis]
- Third-party tools or charges required: [None expected / needs separate written approval]
- Known restrictions and sensitive-data categories to exclude: [List]
- Permission to retain sanitized diagnostic evidence until: [Agreed date and disposal method]

## Fit decision

- [ ] Exactly one issue and a testable expected outcome
- [ ] JavaScript/Node API, webhook or lead-form context
- [ ] Lawful owner permission and safe evidence path
- [ ] No emergency recovery or implementation promise
- [ ] No secrets or personal records in inquiry channel
- [ ] Written scope, timing and payment terms can be agreed

**Decision:** [Fit / needs clarification / out of scope]
**Open questions before acceptance:** [List]
**Next step:** [Written scope + authorized access + payment arrangement; no work started yet]
