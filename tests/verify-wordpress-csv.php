<?php
declare(strict_types=1);

function requireCondition(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$csv = fopen(__DIR__ . '/../wordpress-exchange/comparisons-draft.csv', 'rb');
if ($csv === false) {
    throw new RuntimeException('Unable to open WordPress draft exchange.');
}
$columns = ['slug', 'heading', 'description', 'canonical_reference', 'reviewed_on', 'publication_state', 'comparison_html'];
requireCondition(fgetcsv($csv, null, ',', '"', '') === $columns, 'Header columns do not match.');
$slugs = ['repair-cafe-planner', 'shelter-linen-guide', 'milwaukee-bulky-items', 'food-scrap-drop-off', 'library-scanning', 'library-museum-passes', 'library-seed-borrowing', 'tool-library-borrowing', 'library-sensory-spaces', 'eyeglass-donation-rules', 'library-instrument-borrowing', 'used-bicycle-donations', 'library-memory-labs', 'household-document-shredding', 'library-state-park-passes'];
$expected = [
    'library-state-park-passes' => ['Wisconsin DNR program', 'href="#answer--library-hold--york-county-sc"', 'week'],
    'library-memory-labs' => ['DC Public Library equipment', 'href="#answer--hi8--dc-memory-lab"', 'currently unavailable'],
    'household-document-shredding' => ['Orange County Shred Center', 'href="#answer--watch-shredding--somerset-county"', 'two eligible boxes'],
    'library-instrument-borrowing' => ['City of Sydney instrument collection', 'href="#answer--take-home--sydney-room"', 'Staff can hold'],
    'used-bicycle-donations' => ['Milwaukee Bicycle Collective', 'href="#answer--heavy-rust--bike-new-york"', 'suggested $10 donation'],
    'repair-cafe-planner' => ['Repair Café Wales', 'data-operator="toronto" data-fit="unknown"', 'href="#microwave"'],
    'shelter-linen-guide' => ['No current need', 'SPCA Christchurch Centre', 'href="#bath-towels"'],
    'milwaukee-bulky-items' => ['Commercial and contractor vehicles are excluded', '$30–$45 each', 'href="#commercial-hauler"'],
    'food-scrap-drop-off' => ['Carrboro Town Hall drop-off', 'BPI-certified', 'href="#compostable-plastic-bag"'],
    'library-museum-passes' => ['Burlington County', 'href="#answer--book-venue--boston-aquarium"', 'data-operator="shorewood-betty-brinn" data-fit="excluded"'],
    'library-seed-borrowing' => ['Waikato District Libraries', 'href="#answer--without-card--canton"', 'return seeds they do not sow'],
    'tool-library-borrowing' => ['Charlotte ToolBank current borrowing fees', 'href="#answer--household-borrower--charlotte-toolbank"', 'per week'],
    'library-sensory-spaces' => ['Durham Main Library Sensory Calming Room', 'href="#answer--walk-in--durham-mse"', 'full-privileges'],
    'eyeglass-donation-rules' => ['Georgia recycling center collection policy', 'href="#answer--loose-lenses--georgia-lions"', 'conflict'],
    'library-scanning' => ['11 × 17 inches', 'data-operator="brunswick" data-fit="excluded"', 'href="#no-card"'],
];
foreach ($slugs as $slug) {
    $cells = fgetcsv($csv, null, ',', '"', '');
    requireCondition(is_array($cells) && count($cells) === count($columns), 'Wrong row shape for ' . $slug);
    $row = array_combine($columns, $cells);
    requireCondition($row['slug'] === $slug && $row['publication_state'] === 'STAGING_DRAFT_ONLY', 'Scope moved for ' . $slug);
    requireCondition($row['canonical_reference'] === 'https://itsmeb-lab.github.io/wilke-public-labs/' . $slug . '/', 'Canonical moved for ' . $slug);
    $reviewDate = in_array($slug, ['library-instrument-borrowing', 'used-bicycle-donations', 'library-memory-labs', 'household-document-shredding', 'library-state-park-passes'], true) ? '2026-11-26' : '2026-11-25';
    requireCondition($row['reviewed_on'] === $reviewDate && $row['heading'] !== '' && $row['description'] !== '', 'Missing reviewed metadata.');
    requireCondition(str_contains($row['comparison_html'], "\n"), 'Expected a multiline HTML cell.');
    foreach ($expected[$slug] as $phrase) {
        requireCondition(str_contains($row['comparison_html'], $phrase), 'Expected source-bound content in ' . $slug);
    }
    requireCondition(!preg_match('/href="\.\.?\//', $row['comparison_html']), 'Relative project link remains in ' . $slug);
}
requireCondition(fgetcsv($csv, null, ',', '"', '') === false, 'More than one row per canonical guide.');
fclose($csv);
echo 'PHP ' . PHP_VERSION . " read " . count($slugs) . " intact seven-column comparison drafts.\n";
