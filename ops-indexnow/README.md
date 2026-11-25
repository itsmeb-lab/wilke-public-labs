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

## Observed execution — November 25, 2026

The one-time manifest was introduced in commit `91bd6e784563e09be874e9f2b096c215471969cb`. [Run 45629457542](https://github.com/itsmeb-lab/wilke-public-labs/actions/runs/45629457542), job 139258410514, verified the public ownership file and made one POST for the two allowed URLs. It returned **HTTP 202** at 14:01:01.012 UTC: received, with key validation pending. Indexing and traffic remain unverified; zero automatic retries occurred. The job used six seconds of hosted wall time.

The fixed manifest now exists. Do not modify, replace or recreate it to send another request. Later content changes did not trigger the notification workflow. The worker's absolute authorization expiry remains unchanged; there is no recurring timer.
