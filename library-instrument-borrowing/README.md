# Borrow a Musical Instrument from a Public Library

Compare ukulele, guitar and keyboard lending by card, reservation, age, loan length and return branch in the US, Canada and Australia. Rules apply to the named program. Missing evidence appears as an unconfirmed answer.

- [Published guide](https://itsmeb-lab.github.io/wilke-public-labs/library-instrument-borrowing/)
- [Reviewed catalog](./catalog.json)
- [Comparison CSV](./comparison.csv)

From the repository root, run `node scripts/update-library-instruments.mjs --check`. After editing the reviewed catalog, regenerate with `--write` and update the WordPress draft exchange.
