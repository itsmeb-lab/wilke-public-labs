# One-Issue Diagnostic — customer report and explicit acceptance template

**Blank customer-facing template, not a delivered report or paid-client case.** Replace fields only after a real authorized investigation. Keep completed customer evidence in the agreed private channel, never the public lab repository.

**Engagement/scope reference:** [DIAG-YYYYMMDD-###]
**Report version / prepared at:** [v1, timestamp, timezone]
**Customer-designated reviewer:** [name/role]
**One agreed diagnostic question:** [copy from signed scope]
**System/environment/version tested:** [sanitized, precise]
**Authorized test window and limits:** [reference to owner approval]

## Executive finding

- **Observed result:** [one sentence grounded in actual evidence]
- **Confidence:** [confirmed in permitted environment / likely / inconclusive]
- **Impact:** [bounded observation, not speculative revenue]
- **Recommended next action:** [one prioritized decision, implementation separately quoted]

## Reproduction and evidence ledger

Include timestamps, source version, exact sanitized test inputs and the observable system of record. Mark each item **observed**, **failed**, **not verified**, or **not tested**. Never convert a 200 response, queue acknowledgment, or send attempt into a saved record or recipient acknowledgment without independent proof.

| Stage | Expected evidence | Observed evidence / reference | Status / limit |
| --- | --- | --- | --- |
| Trigger / input | [agreed synthetic event] | [test ID and time] | [ ] |
| Transport | [HTTP or webhook acknowledgment] | [sanitized status/reference] | [ ] |
| Application | [explicit success/error and validation] | [sanitized result] | [ ] |
| Persistence | [matching record plus reference] | [record exists/absent/not checked] | [ ] |
| Retry / duplicate | [idempotent behavior, if permitted] | [result or not authorized] | [ ] |
| Notification / owner | [received/acknowledged evidence] | [inbox/owner evidence or unknown] | [ ] |

**Reproduction recipe:** [safe steps and conditions; no secrets or real customer payloads]
**Evidence artifact references/hashes:** [approved private links and relevant hashes]
**Unreproduced or unsafe steps:** [exact reason, no fabricated result]

## Diagnosis, alternatives, and repair decision

1. **Confirmed facts:** [specific findings, each tied to evidence]
2. **Likely cause:** [why the evidence supports it; not claimed as certainty]
3. **Alternative causes not excluded:** [brief list]
4. **Unknowns and boundaries:** [for example, recipient delivery not verified]
5. **Prioritized repair recommendation:** [specific design/code change proposal; not implemented]
6. **Validation after any separately authorized repair:** [positive, failure, retry/duplicate and owner-receipt acceptance tests]

## Deliverable receipt and clarification

- **Report delivered via:** [agreed channel] **at:** [timestamp/timezone]
- **Delivery/message reference:** [real receipt only]
- **Named reviewer acknowledgment:** [received / unconfirmed, reference]
- **Included clarification:** [one question and agreed response window]
- **Out of scope:** Production changes, guaranteed repair, ongoing support, external spend unless separately contracted
- **Payment status:** [unpaid / invoice issued / processor-confirmed paid; independently reconcile]

## Customer report acceptance — reply required

Please reply with one of the following, referencing this report version:

- **Accepted:** The single agreed *diagnostic report* meets the agreed evidence and explanation scope.
- **Clarification requested:** [precisely which agreed report item needs clarification]
- **Disputed:** [specific missing contracted deliverable and reason]

**Customer decision, named reviewer, reply reference, and date:** [fill only after actual response]

Acceptance of the written diagnosis does **not** mean a production fix, successful customer message delivery, recovered revenue, or payment settlement. Silence is not acceptance. The operator must retain evidence of an affirmative reply.
