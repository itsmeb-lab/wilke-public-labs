# Verify or refresh a public comparison

The three public comparisons share a data projection and retain their own operator rules and URLs.

## After a source changes

Run this read-only command with the operator URL:

```sh
node scripts/review-comparisons.mjs --source https://repaircafesf.org/faq
```

The result lists the rules, preparing-for-the-visit instructions, and operator links that cite the source. It flags links in the surrounding guide, where fee differences and alternate routes can also depend on the original page. Reopen the operator pages, update the affected facts and their real review dates, and regenerate the guide with its documented command. The source lookup does not read the operator’s site or apply edits.

## After a Pages deployment

```sh
node scripts/review-comparisons.mjs --served
```

Run this from the exact deployed revision. It checks the canonical public comparison pages, their CSV downloads, and the sitemap against the checked-out files. It uses ordinary read-only HTTP requests and returns an error for redirects, unavailable URLs, stale responses, or mismatched content. It does not check search indexing, sessions, or referrals.

