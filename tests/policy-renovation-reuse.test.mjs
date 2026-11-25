import assert from "node:assert/strict";
import { test } from "node:test";
import { catalog } from "../published-policy-lab/data.mjs";
import { answerPolicy, validateCatalog } from "../published-policy-lab/engine.mjs";
const place=catalog.places.find(p=>p.id==="charlotte-restore-deconstruction-program");
const answer=(visitDate="")=>answerPolicy(catalog,{placeId:place.id,jurisdictionId:place.jurisdictionId,serviceId:"cabinet_removal",visitDate});
test("renovation reuse is source-bound to removal and separate pickup channels",()=>{
 assert.equal(validateCatalog(catalog),true);const r=answer();
 assert.equal(r.fit,"described");assert.equal(r.place.recordKind,"program");assert.equal(r.place.address,null);
 assert.deepEqual(r.sources.map(s=>s.id).sort(),["charlotte-restore-deconstruction","charlotte-restore-pickup"]);
 assert.match(r.conditions.join(" "),/not an ordinary or Priority Pick-Up booking/);
 assert.match(r.conditions.join(" "),/excludes cabinets from its disassembly service/);
});
test("a no-charge program is conditional on approved reusable donations, not a general free removal offer",()=>{
 const r=answer();assert.match(r.fee,/approved reusable items donated/);assert.match(r.conditions.join(" "),/Staff check reusable condition and approve/);
 assert.match(r.conditions.join(" "),/service area, approved scope, current capacity and removal date/);
 assert.match(r.conditions.join(" "),/does not determine tax value, deductions or eligibility/);
 assert.equal(r.redirectedPlace,null);assert.equal(r.wholeLoad,null);
});
test("no pickup date, holiday entitlement or individual acceptance can be inferred",()=>{
 for(const day of ["2026-11-26","2027-01-04"]){const r=answer(day);assert.equal(r.timing.kind,"unconfirmed");assert.equal(r.timing.availability,"UNVERIFIED");assert.match(r.timing.detail,/does not establish a service window/);assert.equal(Object.hasOwn(r,"eligible"),false);}
 const missing=answerPolicy(catalog,{placeId:"clemson-mulch-program",jurisdictionId:"us-sc-clemson-city",serviceId:"cabinet_removal"});
 assert.equal(missing.fit,"unstated");assert.deepEqual(missing.sources,[]);
});
