# Verify or refresh a public comparison

The five public comparisons share a data projection and retain their own operator rules and URLs.

## After a source changes

Run this read-only command with the operator URL:

```sh
node scripts/review-comparisons.mjs --source https://repaircafesf.org/faq
```

The result lists the rules, preparing-for-the-visit instructions, and operator links that cite the source. It flags links in the surrounding guide, where fee differences and alternate routes can also depend on the original page. Reopen the operator pages, update the affected facts and their real review dates, and regenerate the guide with its documented command. The source lookup does not read the operator’s site or apply edits.

To list sources reviewed before a particular date:

```sh
node scripts/review-comparisons.mjs --reviewed-before 2026-11-26
```

Use the result to prioritize rereads. A listed source has an older review date. It may still be current.

## After a Pages deployment

```sh
node scripts/review-comparisons.mjs --served
```

Run this from the exact deployed revision. It checks the canonical public comparison pages, their CSV downloads, the landing pages, wood-chip assets and the sitemap against the checked-out files. It uses ordinary read-only HTTP requests and returns an error for redirects, unavailable URLs, stale responses, or mismatched content. It also checks canonical HTML and flags page-level indexing exclusions. Run `--robots` for the hosting origin’s robots.txt response. These checks cannot report indexing, sessions or referrals.

## WordPress staging

The [Page Generator Pro exchange](./wordpress-exchange/README.md) preserves one draft row per guide. Regenerate and check its CSV when changing the published HTML. The original site remains the canonical reference.

Answer-card fragments use the stable task and operator IDs. Use the section URL to compare several providers, or the linked provider heading to share a specific card. Keep existing IDs when updating wording or evidence.
