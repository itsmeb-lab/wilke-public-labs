# Repair café visit planner

The [visit planner](https://itsmeb-lab.github.io/wilke-public-labs/repair-cafe-planner/) compares six items against the published rules of five organizers in the United States, Canada and the United Kingdom. It links to the international finder for other places. An item label links directly to its comparison, and the full guide works without JavaScript.

The catalog covers standing rules. A particular event may offer fewer categories and have different intake instructions. An organizer listed for an item has described it in its rules. Find the current event and ask about volunteer availability before making the trip.

## Update sources and regenerate

1. Review the original operator pages. Update the exact rules affected and the review dates for sources actually checked. Keep operator identity and jurisdiction separate.
2. Use `listed` for a named item the program considers, `excluded` for an explicit restriction, and `ask` for an express qualification or local discretion. Leave an operator/item pair absent when the evidence is inconclusive. The generated `unknown` row has an organizer route and empty rule, policy source and source-date fields.
3. Run `node scripts/update-repair-cafe.mjs --write`, then `node scripts/update-repair-cafe.mjs --check` and `npm test` from the repository root. Commit the catalog and both generated surfaces together.

## Reuse in another publishing route

The [comparison CSV](./comparison.csv) contains joined operator and item rows, stable jurisdiction and record IDs, the fit state, a per-policy check date and an organizer route. Select the rows you need and retain these columns together. Each row describes a comparison cell. A published page should group rows by a reader task and show meaningful differences, including unconfirmed cells.

For a WordPress proof of concept, treat the CSV as one multi-column Page Generator Pro keyword dataset, following the [vendor’s keyword documentation](https://www.wpzinc.com/documentation/page-generator-pro/keywords/). Test the joined row mapping and conditional output in staging. The [published policy exchange guide](../published-policy-lab/WORDPRESS-EXCHANGE.md) covers row alignment and review. This repository does not require a WordPress installation.
