# Stage a comparison in Page Generator Pro

[Download the draft comparison exchange](./comparisons-draft.csv). The seven fields in each row describe one source-linked guide. The data carries a `STAGING_DRAFT_ONLY` value and the existing canonical reference. Keep any imported copy in a private WordPress staging site.

| Page Generator Pro field | Keyword or setting |
|---|---|
| Keyword name and source | `comparison`, CSV File, comma delimiter, first row as column names |
| Generation method | Sequential, using this single multi-column keyword |
| Title | `{comparison(heading)}` |
| Draft permalink segment | `{comparison(slug)}` |
| Standalone HTML body | `{comparison(comparison_html)}` in a compatible HTML block or text editor |
| Editor notes | `{comparison(description)}`, `{comparison(canonical_reference)}`, `{comparison(reviewed_on)}` and `{comparison(publication_state)}` |

Use the vendor's [one-draft Test action](https://www.wpzinc.com/documentation/page-generator-pro/generate-run/#test). Review the first draft before selecting any other row. The title, anchor navigation, conditional policy labels, source links, conflicting-source note and excerpt must stay in the same row. The body carries plain HTML and comparison styles are supplied by the existing public site. WordPress theme render and editor sanitization still need staging verification.

For secondary review, inspect `No current need` in the shelter guide and both city sources behind the Wauwatosa TV fee difference in the municipal guide. The original comparison pages are the canonical references in the dataset. The exchange does not contain a WordPress publish action, access credentials or an indexing integration.

Use [the vendor's CSV tutorial](https://www.wpzinc.com/documentation/page-generator-pro/tutorial-using-a-csv-file/) to confirm column settings for your installed version. Build the checked exchange with `node scripts/export-wordpress-comparison.mjs --write` and verify it with `--check`. Run `php tests/verify-wordpress-csv.php` to check the export with PHP's native CSV parser. The [disposable WordPress roundtrip](https://github.com/itsmeb-lab/wilke-public-labs/actions/runs/45763029870) created and restored 15 drafts with exact HTML, source canonicals and review dates. It used WordPress 7.1.5 and WordPress Importer 0.9.7. Use the one-draft check above to verify the installed Page Generator Pro version, editor and content-group settings.

## Replay an Atlas WXR draft with WP-CLI

For an exact WXR replay on private staging, load the optional companion for the import command.

```bash
wp --path=/path/to/staging \
  --require=/path/to/wilke-public-labs/scripts/wp-cli-atlas-draft-metadata.php \
  import /path/to/draft.xml --authors=skip --skip=attachment
```

The companion skips exact repeats of Atlas source URL, review date and import-state metadata on a draft page. Review changed exports before importing them. WordPress Importer handles post matching and distinct metadata values.

Build the Spanish Milwaukee WXR draft with `node scripts/export-wordpress-draft.mjs --slug milwaukee-articulos-voluminosos --output milwaukee-es-draft.xml`. The WXR feed and imported guide body carry the source language.


