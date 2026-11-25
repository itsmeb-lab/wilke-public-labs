# Bulky items in Milwaukee and Wauwatosa

This [guide](https://itsmeb-lab.github.io/wilke-public-labs/milwaukee-bulky-items/) compares four municipal pickup and drop-off routes for the City of Milwaukee and the City of Wauwatosa. Each rule keeps the municipality and collection channel in its scope. The guide links to city instructions for the current fee, service address, vehicle restrictions and availability.

The [reviewed catalog](./catalog.json) drives the HTML and [CSV](./comparison.csv). Run `node scripts/update-milwaukee-bulky.mjs --write` after reviewing a source change, then `node scripts/update-milwaukee-bulky.mjs --check` and `npm test`. Preserve whether a fact is an explicit rule or needs confirmation. Keep the Wauwatosa TV fee difference visible while the two source pages disagree.

A municipal residential route does not verify the receiving facility of a private cleanout crew. This guide contains no contractor booking, quote or lead intake.
