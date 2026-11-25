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
$slugs = ['repair-cafe-planner', 'shelter-linen-guide', 'milwaukee-bulky-items'];
$expected = [
    'repair-cafe-planner' => ['Repair Café Wales', 'data-operator="toronto" data-fit="unknown"', 'href="#microwave"'],
    'shelter-linen-guide' => ['No current need', 'SPCA Christchurch Centre', 'href="#bath-towels"'],
    'milwaukee-bulky-items' => ['Commercial and contractor vehicles are excluded', '$30–$45 each', 'href="#commercial-hauler"'],
];
foreach ($slugs as $slug) {
    $cells = fgetcsv($csv, null, ',', '"', '');
    requireCondition(is_array($cells) && count($cells) === count($columns), 'Wrong row shape for ' . $slug);
    $row = array_combine($columns, $cells);
    requireCondition($row['slug'] === $slug && $row['publication_state'] === 'STAGING_DRAFT_ONLY', 'Scope moved for ' . $slug);
    requireCondition($row['canonical_reference'] === 'https://itsmeb-lab.github.io/wilke-public-labs/' . $slug . '/', 'Canonical moved for ' . $slug);
    requireCondition($row['reviewed_on'] === '2026-11-25' && $row['heading'] !== '' && $row['description'] !== '', 'Missing reviewed metadata.');
    requireCondition(str_contains($row['comparison_html'], "\n"), 'Expected a multiline HTML cell.');
    foreach ($expected[$slug] as $phrase) {
        requireCondition(str_contains($row['comparison_html'], $phrase), 'Expected source-bound content in ' . $slug);
    }
    requireCondition(!preg_match('/href="\.\.?\//', $row['comparison_html']), 'Relative project link remains in ' . $slug);
}
requireCondition(fgetcsv($csv, null, ',', '"', '') === false, 'More than one row per canonical guide.');
fclose($csv);
echo 'PHP ' . PHP_VERSION . " read three intact seven-column comparison drafts.\n";
