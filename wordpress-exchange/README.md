# Stage a comparison in Page Generator Pro

[Download the draft comparison exchange](./comparisons-draft.csv). The seven fields in each row describe one source-linked guide. The CSV contains six rows, one per guide. The data carries a `STAGING_DRAFT_ONLY` value and the existing canonical reference. Keep any imported copy in a private WordPress staging site.

| Page Generator Pro field | Keyword or setting |
|---|---|
| Keyword name and source | `comparison`, CSV File, comma delimiter, first row as column names |
| Generation method | Sequential, using this single multi-column keyword |
| Title | `{comparison(heading)}` |
| Draft permalink segment | `{comparison(slug)}` |
| Standalone HTML body | `{comparison(comparison_html)}` in a compatible HTML block or text editor |
| Editor notes | `{comparison(description)}`, `{comparison(canonical_reference)}`, `{comparison(reviewed_on)}` and `{comparison(publication_state)}` |

Use the vendor’s [one-draft Test action](https://www.wpzinc.com/documentation/page-generator-pro/generate-run/#test). Review the first draft before selecting any other row. The title, anchor navigation, conditional policy labels, source links, conflicting-source note and excerpt must stay in the same row. The body carries plain HTML and comparison styles are supplied by the existing public site. WordPress theme render and editor sanitization still need staging verification.

For secondary review, inspect `No current need` in the shelter guide and both city sources behind the Wauwatosa TV fee difference in the municipal guide. The original comparison pages are the canonical references in the dataset. The exchange does not contain a WordPress publish action, access credentials or an indexing integration.

Use [the vendor’s CSV tutorial](https://www.wpzinc.com/documentation/page-generator-pro/tutorial-using-a-csv-file/) to confirm column settings for your installed version. Build the checked exchange with `node scripts/export-wordpress-comparison.mjs --write` and verify it with `--check`. Run `php tests/verify-wordpress-csv.php` to check the export with PHP’s native CSV parser. PHP parsing checks data portability. The Page Generator Pro account, its installed version and actual import remain separate checks.
