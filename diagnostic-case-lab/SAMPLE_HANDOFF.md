# Sample handoff — synthetic case SYN-API-001

- **Status:** Executable teaching example, not a customer report, paid case study, security certification, or production fix.
- **Question:** Why does a form say "Sent" when storage rejected the write?
- **Scope:** One fictional Node-style form-to-storage handoff. No live customer system or network calls.
- **Reproduction method:** Run the browser case or the pure core fixture through Node tests. Inputs are deterministic and synthetic.

## Observed fixture evidence

| Layer | False-success reproduction | Guarded comparison |
| --- | --- | --- |
| HTTP | 200 / transport accepted | 200 / transport accepted |
| Application | success=false | success=false |
| Persisted row/reference | 0 / none | 0 / none |
| UI wording | "Sent" | "Not saved" |
| Claim truthful? | No | Yes |
| Email/inbox delivery | Unknown; not tested | Unknown; not tested |

The original rule used HTTP success to choose the UI message. The comparison chooses a positive save status only when application.success=true, exactly one matching row exists and a nonempty saved reference is verified.

## Finding (confirmed only within the fixture)

The false-success UI makes a claim that conflicts with the persistence evidence. HTTP 200 is transport evidence, not proof that the intended storage or notification operation completed.

## Proposed repair (not performed on a real system)

Do not clear the user's form or say "sent" on HTTP status alone. Show a truthful failure when the agreed acceptance condition fails. Preserve inputs; show the saved reference only after verified persistence; report notification as pending or unknown unless it is independently established.

## Focused acceptance cases

1. Save rejected: user sees failure and can retry safely.
2. Success flag but no saved reference: do not show success.
3. Exactly one saved row with matching reference: the UI may say saved, not delivered.
4. Same event repeated: verify no unintended duplicate, but this separate edge path is not simulated by this case.
5. Notification/receiving inbox: requires a separate authorized test and evidence; not simulated.

## Limits and next decision

The lab does not diagnose production causes, prove email delivery, issue client invoices, or write to customer databases. A real engagement would replace fixture observations with authorized source/version, traces and evidence, and record unknowns honestly. Recommended next step for an actual system is an approved implementation scope followed by the five acceptance cases above.

**Handoff conclusion:** One local display-condition defect is demonstrated; no customer result or monetary outcome is claimed.
