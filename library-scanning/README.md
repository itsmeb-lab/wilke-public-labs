# Library scanning guide

Compare published document scanning at seven named libraries. The [guide](https://itsmeb-lab.github.io/wilke-public-labs/library-scanning/) keeps direct email, USB, card requirements, page size and duplex feeders separate.

Update checked facts and dates in [the source catalog](./catalog.json). Run `node scripts/update-library-scan.mjs --write`, then `--check` and `npm test`. The [comparison CSV](./comparison.csv) retains source dates and exact scope.
