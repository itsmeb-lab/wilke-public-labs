# Voice-to-CRM Handoff Lab — synthetic buyer-facing proof

This is a **browser-only simulation** of a voice receptionist's downstream CRM/scheduling handoff. It models six realistic *workflow decisions* without sending calls, texts, emails, notifications, appointments, webhook requests or CRM records.

[Open the demo when published](https://itsmeb-lab.github.io/wilke-public-labs/voice-to-crm-handoff/) · [Public lab index](https://itsmeb-lab.github.io/wilke-public-labs/) · [Upwork profile](https://www.upwork.com/freelancers/~019f8d1b56a7ac81d6)

## Six synthetic journeys

- Daytime appointment enters the scheduling desk's **review** state, not an invented confirmed booking.
- Duplicate carrier webhook reuses the first simulated receipt and creates no second handoff.
- Outside-hours request routes to callback review.
- SMS consent missing suppresses outbound acknowledgments.
- Urgent request is held for a human, not handled as an automated emergency response.
- Malformed caller ID is rejected before the proposed handoff.

All phone numbers are reserved fictional 555-01XX examples, all call IDs start with `DEMO-CALL-`, and every trace is ephemeral, created in JavaScript memory only. Demo outputs are not durable audit records or customer receipts.

## Try it

From repository root:

```bash
npm test
python -m http.server 8080
```

Open `http://localhost:8080/voice-to-crm-handoff/`. The webpage uses no external API calls or third-party scripts. Its receipt copy control reads only the synthetic in-memory output. Running from a local HTTP server is necessary for native JavaScript modules.

## Scope and truth boundary

This is evidence of safe routing logic, validation, deduplication and transparent trace design—not a paid-client case study, live Twilio/Vapi phone agent, CRM integration, speech recognition, carrier callback handler, actual booking, provider-wide idempotency, production security, privacy certification, or externally accepted result. It has **no real customers, no third-party data and no claimed paid commercial outcome**.

Production implementation would separately require authenticated provider ingress, sender/recipient opt-in, consent lifecycle, durable tenant-bound storage, cross-instance deduplication, access controls, receiver acknowledgment, monitoring, retry and rollback, provider terms, testing with authorized data, privacy review, and acceptance by the client.

## Tests and review

The repository's existing `node --test` command includes 12 cases covering routing, SMS permission, duplicate suppression, caller sanitization, escalation and time-zone boundaries. A draft pull request is for independent source/UX/privacy review; **do not merge or advertise as a live asset until checks and publishing authority pass**.

Original synthetic example for an honest first review; no fake customer outcomes.