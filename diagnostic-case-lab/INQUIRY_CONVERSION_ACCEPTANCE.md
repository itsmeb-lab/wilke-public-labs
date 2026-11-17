# Inquiry conversion acceptance — published $150 offer bridge

This is an **internal release/fulfillment acceptance contract**, not a customer example, checkout or a claim that an inquiry was received. It applies to the PR candidate at `diagnostic-case-lab/index.html` and the separately owned LIVE offer at https://wilkeservices.com/software-diagnostic. Do not edit that live site's source from this lane.

## Reproducible test, safe boundary

From the repository root on an authorized workstation with an already-installed Chrome/Edge:

`npm run verify:inquiry -- --out-dir C:\dev\_ops_receipts\ATLAS_PARALLEL_SESSIONS_20261115\L04-INQUIRY-ACCEPTANCE-20261116`

The script creates a unique receipt directory and temporary isolated browser profile. It derives the campaign-tagged destination from our actual case-lab CTA, visits the published offer with **GET-only, first-party static network requests**, and aborts third-party requests and *all* non-GET operations before entering anything. Three fields contain only hard-coded SYN-API-001 fiction. It prepares and checks a local draft, then tests Copy's truthful status; it **never clicks Open email app, sends a message, submits a form, invokes checkout or uses a saved customer browser session**. A successful test is NOT a lead. Avoid unnecessary repeat traffic. This isolated browser test **blocks** third-party scripts requested by the normal live page (including analytics); it does not certify how those scripts behave in an ordinary visitor session, establish legal privacy compliance, or record a visitor's actual consent.

## Release acceptance conditions

| Gate | What qualifies | Current bounded result |
| --- | --- | --- |
| Entry / attribution | Source-tagged public-lab link lands on the correct live `#scope-request` and retains approved query tags | PASS for the landing URL |
| Fit | Three required fields, one existing JavaScript/Node issue, no secret or customer-file upload | PASS for published UI; actual buyer permission not tested |
| Privacy / consent | Plain-language no-secret notice, privacy link and manual-send warning; user independently chooses whether to send | PASS for disclosures; no website opt-in/send event recorded |
| Prepared brief | All 3 synthetic entries appear in read-only preview; prepared state never claims receipt | PASS |
| Copy fallback | A selectable preview exists if clipboard permission fails; neither path claims delivery | PASS for manual fallback in isolated headless Chrome; clipboard success not demonstrated |
| Referral handoff | Bounded, non-personal referral source is carried into the prepared email's content/subject, not merely the page URL | **NOT MET**: content lacks campaign tags; compiled sender subject is fixed |
| Receiving owner proof | Legitimate, opted-in customer sends a real inquiry and authorized receiving inbox records delivery ID/time | NOT TESTED; no fabricated inquiry allowed |
| Paid acceptance | Customer agrees one-issue scope, authorized access, timing and founder-approved invoice/payment route | NOT TESTED; no merchant action here |

The generated machine-readable `inquiry-conversion-acceptance.json` reports `PASS_WITH_ATTRIBUTION_GAP` when privacy/preparation checks pass but the referral handoff does not. No automatic release approval is implied. Last checked public bundle: `https://wilkeservices.com/assets/index-kH_UEv0w.js`, where the brief builder emits a generic source line and an unvarying scope-inquiry subject.

## Correct owner handoff / minimal acceptance for a future site fix

Lane 02 owns the WilkeServiceCo source and must decide whether to correct the first-party email composer. If authorized, map only **allowlisted, non-personal** referral labels (for example `wilke_public_labs` and `diagnostic_case_lab`) to a clearly identified source line in both the on-page preview and its email-app draft. Do not blindly copy arbitrary URL parameters, tokens, PII or third-party click IDs into email, logs, analytics or receipts.

A future browser test should prove (a) the allowed source marker survives preview and email draft, (b) unexpected/overlong or sensitive query values are ignored, (c) no copied field implies delivery, and (d) only an actual receiving-owner message receipt can establish receipt of a real buyer inquiry. A future consented direct web form would require its own spam protection, privacy/retention decisions, server receipt and independent source review. **No such form is authorized by this QA pack.**

## Release versus payment gates

The public diagnostic-case-lab still requires a genuine independent GitHub source reviewer and owner-approved exact-head merge of PR #3 before Pages/sitemap publication. The $150 merchant route is a separate founder/client authorization gate; do not connect banking, create checkout, take payment, or route Upwork relationships off-platform. A rollback after an approved deployment must use a reviewed revert PR or other owner-approved recoverable Git change, then verify Pages and sitemap readback. This document grants no deployment or rollback authority.
