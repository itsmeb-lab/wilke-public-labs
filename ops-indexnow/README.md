# One finite IndexNow notification

This optional release step notifies the global IndexNow endpoint about only the public lab index and Published Policy Lab, both materially changed November 25, 2026. It is not a Google indexing request, a backlink placement or proof of indexing/traffic.

The verification text file sits at the GitHub Pages **project root**. Its explicit `keyLocation` limits this code's scope to that project path; the code further permits exactly two canonical URLs. No Wilke production domain or other GitHub Pages project is submitted.

The workflow has no timer, cron, dispatch button, provider credential, account connection or secret. It can run only when the fixed one-time manifest path changes on main. The script additionally requires first attempt, an add-only commit containing that manifest alone, exact URLs and an expiry at November 25, 2026, 15:07:13.475 UTC. Modifying a previously added manifest or rerunning the job cannot submit.

Before its one POST, the worker must retrieve the already-deployed verification file with HTTP 200 and exact body. Redirects, mismatches and expired authorization stop the work. Each HTTP call has a 15-second timeout. HTTP failure or uncertainty is recorded without automatic retries. A 202 receipt leaves key validation pending; even 200 does not prove indexing.

Only standard public-repository hosted compute is used. Receipts stay in job logs and the job summary; no additional artifact or cache storage is uploaded.

## Two stages

1. Merge and test this code and verification file, with **no submission manifest**. Confirm the public file is deployed.
2. Add only the fixed manifest in a separate reviewed commit while the authorized window remains open. The existing content is already public; the added manifest makes no content or ownership change.

No submission has occurred just because these files exist. Consult the actual workflow receipt.

Official references: https://www.indexnow.org/documentation · https://www.indexnow.org/faq · https://docs.github.com/en/billing/concepts/product-billing/github-actions
