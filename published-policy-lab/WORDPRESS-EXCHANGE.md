# Optional Page Generator Pro exchange example

This is a small data handoff for an existing WordPress installation. It does not install a plugin, connect an account, call an AI provider or publish pages.

The sample [CSV](./examples/pgp-policy-source.csv) carries **29 joined policy rows** from the same thirteen-entry snapshot used by this lab. They are data records, not 29 approved landing pages. The interactive page already answers these selected tasks in one place.

## Why one joined keyword matters

Place, state, jurisdiction, task, restriction and source belong together. Splitting them into independent lists and using an unrestricted Cartesian combination can pair a place with another place's policy. Preserve the row relationship.

For example, a vehicle-title restriction in Jacksonville, North Carolina must not be applied to Perry Memorial in Henderson, or to a similarly named county in Kentucky.

## Current documented route

The vendor's current documentation describes CSV File, CSV URL and Spreadsheet keyword sources. Its older Import CSV screen was replaced by those source options in PGP 5.0.5 and later.

For a bounded, manually reviewed test on a suitable existing site:

1. Confirm the installed plugin version and the site's existing permissions and backup.
2. Use a new isolated Content Group and a **single relational keyword** for this example table.
3. Keep the supplied 17 header names and comma delimiter. Confirm every column lands on its intended row.
4. Review one generated **draft** only. Do not create a scheduled or published batch.
5. Check the exclusion, unknown fee, jurisdiction, source URL and check date in the actual rendered draft.
6. Remove the test if the result does not preserve those facts.

A single-keyword generation uses the vendor's Sequential method. With multiple keywords, Sequential ends when the shortest list is exhausted. All enumerates combinations; neither method proves that a page is useful or supported.

The reviewed exchange can be regenerated locally with `npm run policy:update` and checked with `npm run policy:check`. The helper refreshes the existing joined CSV and plain-HTML snapshot; it does not connect WordPress or publish.

The example is not an import acceptance test. No WordPress import, shortcode escaping, page-builder rendering or plugin execution has been exercised here. Legacy import guidance has different details around quoted and empty cells; test the actual installed CSV source before relying on compatibility.

## Fields that must survive

| Field | Meaning |
| --- | --- |
| record_kind | Place or program; a program record is not a branch address or stock report. |
| record_id | Stable joined place/task identifier, not a search keyword. |
| state / locality / jurisdiction_id | Explicit geography; a postal label alone is not eligibility. |
| policy_fit | Described, excluded or unstated in the checked source. |
| policy_summary / conditions | Limited policy facts; not individual approval. |
| fee_description | Unknown remains explicit rather than becoming zero. |
| alternate_place_id | A source-supported alternate in this snapshot, not a nearest-place calculation. |
| source_urls / checked_on | Primary references and this lab's review date. |
| live_availability | Always UNVERIFIED. |
| publication_status | Always EXCHANGE_ONLY_NOT_A_PAGE_APPROVAL. |

The CSV omits visit windows and closure calendars deliberately; those are separate, scoped data in the browser lab. Do not turn the CSV into opening-hours or holiday claims.

## Optional adapter, separate responsibilities

Use a publishing adapter to render already reviewed data. Keep evidence review, duplicate/consolidation decisions and publication authority upstream. A keyword's presence, successful import or generated preview is not permission to publish.

The original plugin offers mature WordPress generation features. This repository does not claim replacement parity or that a particular license includes other WP Zinc products.

## Vendor references

- [Keyword sources and relational columns](https://www.wpzinc.com/documentation/page-generator-pro/keywords/)
- [Generation methods](https://www.wpzinc.com/documentation/page-generator-pro/generate-methods/)
- [Legacy import notice](https://www.wpzinc.com/documentation/page-generator-pro/keywords-import-csv/)
- [Content Groups and generation controls](https://www.wpzinc.com/documentation/page-generator-pro/generate-content/)
