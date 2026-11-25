import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { catalog } from "../published-policy-lab/data.mjs";
import { SERVICES } from "../published-policy-lab/engine.mjs";
const csv=readFileSync(new URL("../published-policy-lab/examples/pgp-policy-source.csv",import.meta.url),"utf8");
// This fixture is deliberately all-quoted and one physical line per record.
// This is a test reader for this exchange format, not a plugin/import parser.
const rows=csv.trimEnd().split(/\r?\n/).map(line=>{
 const cells=[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(match=>match[1].replace(/""/g,'"'));
 assert.equal(cells.map(value=>'"'+value.replace(/"/g,'""')+'"').join(","),line);
 return cells;
});
const headers=["record_id","place_name","state","locality","jurisdiction_id","task_id","task_label","policy_fit","policy_summary","conditions","fee_description","alternate_place_id","source_urls","checked_on","live_availability","publication_status","record_kind"];
test("exchange fixture has exact columns and all 21 unique joined records",()=>{
 assert.deepEqual(rows[0],headers);assert.equal(rows.length,22);
 for(const row of rows)assert.equal(row.length,17);
 assert.equal(new Set(rows.slice(1).map(row=>row[0])).size,21);
});
test("every exchange value agrees with its joined source catalog record",()=>{
 const sources=new Map(catalog.sources.map(source=>[source.id,source.url]));
 const expected=catalog.places.flatMap(place=>Object.entries(place.policies).map(([task,policy])=>[
  place.id+"--"+task,place.name,place.region,place.locality,place.jurisdictionId,
  task,SERVICES[task],policy.fit,policy.summary,
  (policy.conditions||[]).join(" / ")||"No additional condition modeled; check the source.",
  policy.fee||"Not stated in this snapshot.",policy.redirectPlaceId||"Not applicable",
  policy.sourceIds.map(id=>sources.get(id)).join(" / "),catalog.checkedOn,
  "UNVERIFIED","EXCHANGE_ONLY_NOT_A_PAGE_APPROVAL",place.recordKind||"place"
 ]));
 assert.deepEqual(rows.slice(1),expected);
});
test("exchange retains unknowns and contains no spreadsheet-formula prefix",()=>{
 for(const row of rows.slice(1)){
  assert.equal(row[14],"UNVERIFIED");assert.equal(row[15],"EXCHANGE_ONLY_NOT_A_PAGE_APPROVAL");
  for(const cell of row)assert.doesNotMatch(cell,/^[\t\r\n ]*[=+\-@]/);
  if(row[7]!=="described")assert.equal(row[10],"Not stated in this snapshot.");
 }
});
