import assert from "node:assert/strict";
import { test } from "node:test";
import { catalog } from "../published-policy-lab/data.mjs";
import { answerPolicy, validateCatalog, PROGRAM_SCOPE_NOTE } from "../published-policy-lab/engine.mjs";
function answer(placeId,serviceId,visitDate=""){
 const p=catalog.places.find(place=>place.id===placeId);
 return answerPolicy(catalog,{placeId,serviceId,jurisdictionId:p.jurisdictionId,visitDate});
}
test("expanded snapshot identifies program records separately from seven physical places",()=>{
 assert.equal(validateCatalog(catalog),true);
 assert.equal(catalog.places.length,13);
 assert.equal(catalog.places.filter(p=>p.recordKind==="program").length,6);
});
test("hotspot answer retains the seven-day loan, queue and borrower restrictions",()=>{
 const r=answer("charlotte-hotspots-program","hotspot_borrowing");
 assert.equal(r.fit,"described");assert.match(r.summary,/seven-day/);
 assert.match(r.conditions.join(" "),/18\+.*photo ID.*below \$10/);
 assert.match(r.conditions.join(" "),/one hotspot.*seven days without renewal/);
 assert.deepEqual(r.sources.map(s=>s.id),["charlotte-hotspots"]);
});
test("hotspot return is to staff and carries no invented charge calculation",()=>{
 const r=answer("charlotte-hotspots-program","hotspot_borrowing");
 assert.ok(r.conditions.some(text=>text.includes("to staff")&&text.includes("rather than a book drop")));
 assert.match(r.conditions.join(" "),/continental United States/);
 assert.match(r.fee,/Not stated/);assert.match(r.conditions.join(" "),/does not calculate fees/);
});
test("things borrowing preserves named-card and separate item-group limits",()=>{
 const r=answer("clayton-things-program","things_borrowing");
 assert.equal(r.fit,"described");assert.match(r.conditions.join(" "),/Hocutt-Ellington Memorial Library card/);
 assert.match(r.conditions.join(" "),/two kit items plus one technology item/);
 assert.match(r.conditions.join(" "),/additional lending rules/);
 assert.deepEqual(r.sources.map(s=>s.id),["clayton-things"]);
});
test("program rules do not become a physical pickup or future-day availability claim",()=>{
 const r=answer("charlotte-hotspots-program","hotspot_borrowing","2027-01-04");
 assert.equal(r.place.recordKind,"program");assert.equal(r.place.address,null);
 assert.equal(r.scopeNote,PROGRAM_SCOPE_NOTE);
 assert.equal(r.timing.availability,"UNVERIFIED");assert.equal(r.timing.kind,"unconfirmed");
 assert.match(r.timing.detail,/No visit window/);
});
test("program and jurisdiction must still bind exactly",()=>{
 assert.throws(()=>answerPolicy(catalog,{placeId:"charlotte-hotspots-program",serviceId:"hotspot_borrowing",jurisdictionId:"us-sc-union-county"}),/jurisdiction do not match/);
});
test("a program's other unmodeled borrowing task remains unstated",()=>{
 const r=answer("clayton-things-program","hotspot_borrowing");
 assert.equal(r.fit,"unstated");assert.deepEqual(r.sources,[]);
});
test("unknown record kind is rejected before an answer",()=>{
 const c=structuredClone(catalog);c.places.at(-1).recordKind="guaranteed-pickup";
 assert.throws(()=>validateCatalog(c),/Invalid record kind/);
});
test("a program record cannot silently acquire a street pickup address",()=>{
 const c=structuredClone(catalog);c.places.at(-1).address="1 Invented Fixture Street";
 assert.throws(()=>validateCatalog(c),/must not imply a specific pickup address/);
});
test("existing physical places keep their original address and no program note",()=>{
 const r=answer("union-airport","electronics");
 assert.equal(r.place.recordKind,"place");assert.equal(r.scopeNote,null);
 assert.match(r.place.address,/570 Sardis Road/);
});
