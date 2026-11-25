# Animal shelter linen donation guide

The [guide](https://itsmeb-lab.github.io/wilke-public-labs/shelter-linen-guide/) compares six household linen categories across seven selected shelters in the United States and New Zealand. It includes a link from each checked rule to its operator, and keeps local animal-care drop-off instructions separate from thrift or resale channels.

The [catalog](./catalog.json) distinguishes an explicit restriction from a current wish-list preference. "Ask first" means a related category is listed, but size, type or another detail needs confirmation. An unconfirmed comparison cell has no supporting policy citation and links to the operator for confirmation.

## Maintain the guide

Reopen the cited operator pages and update each affected item, instruction and source review date. Run `node scripts/update-shelter-linens.mjs --write` and `node scripts/update-shelter-linens.mjs --check`, then `npm test` from the repository root. Commit the reviewed catalog, HTML, and CSV together. The shared organizer-comparison projector also serves the repair café guide.

The [comparison CSV](./comparison.csv) retains the joined scope and review dates for use in another publishing workflow. A row represents one answer in the comparison. A new page needs a distinct reader task and independently checked source support.
