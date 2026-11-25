// Reusable checks; run with real node:assert/strict in published-policy.test.mjs.
// Test cases use documented sample policies. They do not contact agencies.
export function policyChecks(assert,api,catalog) {
 const {answerPolicy,parseVisitDate,validateCatalog}=api;
 const copy=()=>JSON.parse(JSON.stringify(catalog));
 const ask=(id,service,date="")=>{
  const p=catalog.places.find(x=>x.id===id);
  return answerPolicy(catalog,{placeId:id,jurisdictionId:p.jurisdictionId,serviceId:service,visitDate:date});
 };
 const bad=(change,pattern)=>()=>{const c=copy();change(c);assert.throws(()=>validateCatalog(c),pattern);};
 return [
 ["catalog snapshot is internally valid",()=>assert.equal(validateCatalog(catalog),true)],
 ["Jonesville electronics points only to the designated Airport station",()=>{const r=ask("union-jonesville","electronics");assert.equal(r.fit,"excluded");assert.equal(r.redirectedPlace.id,"union-airport");assert.deepEqual(r.sources.map(s=>s.id),["sc-des-union"]);}],
 ["Airport electronics is described without claiming live access",()=>{const r=ask("union-airport","electronics");assert.equal(r.fit,"described");assert.equal(r.timing.availability,"UNVERIFIED");}],
 ["farmer oil uses Cross Keys, not a nearby generic recycling station",()=>{assert.equal(ask("union-airport","farmer_oil").redirectedPlace.id,"union-cross-keys");assert.equal(ask("union-jonesville","farmer_oil").redirectedPlace.id,"union-cross-keys");assert.equal(ask("union-cross-keys","farmer_oil").fit,"described");}],
 ["ambiguous paint preparation remains unstated at every sampled county station",()=>{for(const id of ["union-airport","union-cross-keys","union-jonesville"])assert.equal(ask(id,"paint").fit,"unstated");}],
 ["Perry title process and missing fee remain separate facts",()=>{const r=ask("perry-memorial","vehicle_title");assert.equal(r.fit,"described");assert.ok(r.conditions.some(x=>/seller/i.test(x)));assert.match(r.fee,/not stated/i);}],
 ["Onslow title exclusion is not overwritten by its basic notary service",()=>{assert.equal(ask("onslow-jacksonville","vehicle_title").fit,"excluded");assert.equal(ask("onslow-jacksonville","basic_notary").fit,"described");}],
 ["Rowan Kentucky motorized-vehicle restriction is preserved",()=>{const r=ask("rowan-morehead-ky","vehicle_title");assert.equal(r.fit,"excluded");assert.equal(r.place.region,"KY");assert.equal(r.place.locality,"Morehead");}],
 ["Haywood does not infer a vehicle-title policy from general notary availability",()=>assert.equal(ask("haywood-waynesville","vehicle_title").fit,"unstated")],
 ["fees are not borrowed between different libraries",()=>{assert.match(ask("onslow-jacksonville","basic_notary").fee,/free/i);assert.match(ask("perry-memorial","basic_notary").fee,/not stated/i);}],
 ["printing does not inherit weekday-only notary hours",()=>{for(const id of ["haywood-waynesville","rowan-morehead-ky"]){const r=ask(id,"printing","2026-11-28");assert.equal(r.fit,"described");assert.equal(r.timing.kind,"unconfirmed");assert.equal(r.timing.regularLabel,undefined);}}],
 ["every supplied 2026 county holiday overrides the ordinary weekday pattern",()=>{for(const d of catalog.closureCalendars[0].dates){const r=ask("union-cross-keys","farmer_oil",d);assert.equal(r.timing.kind,"listed_closure",d);assert.ok(r.sources.some(s=>s.id==="union-holidays-2026"));}}],
 ["an unlisted Friday is a pattern match, not a real-time open assertion",()=>{const r=ask("union-airport","electronics","2026-11-27");assert.equal(r.timing.kind,"regular_pattern_only");assert.equal(r.timing.availability,"UNVERIFIED");}],
 ["a known non-service weekday remains outside the pattern",()=>assert.equal(ask("union-airport","electronics","2026-11-29").timing.kind,"regular_day_excluded")],
 ["a future year does not reuse the 2026 holiday calendar",()=>{const r=ask("union-cross-keys","farmer_oil","2027-11-25");assert.equal(r.timing.kind,"exception_data_unknown");assert.ok(!r.sources.some(s=>s.id==="union-holidays-2026"));}],
 ["notary weekday match does not invent a holiday calendar or appointment",()=>{const r=ask("onslow-jacksonville","basic_notary","2026-11-27");assert.equal(r.timing.kind,"exception_data_unknown");assert.equal(r.timing.availability,"UNVERIFIED");}],
 ["no selected date stays optional",()=>{const r=ask("union-airport","electronics");assert.equal(r.visitDate,null);assert.equal(r.timing.kind,"unconfirmed");}],
 ["an unsupported task at a place stays unknown with no schedule borrowed",()=>{const r=ask("union-airport","printing","2026-11-27");assert.equal(r.fit,"unstated");assert.equal(r.timing.kind,"unconfirmed");assert.deepEqual(r.sources,[]);}],
 ["same-name jurisdiction mismatch is refused",()=>assert.throws(()=>answerPolicy(catalog,{placeId:"rowan-morehead-ky",jurisdictionId:"us-nc-rowan-county",serviceId:"basic_notary"}),/jurisdiction/)],
 ["unknown place is refused rather than matched by a similar name",()=>assert.throws(()=>answerPolicy(catalog,{placeId:"rowan-nc",jurisdictionId:"us-nc-rowan-county",serviceId:"basic_notary"}),/place/)],
 ["prototype-like task keys are refused",()=>{for(const id of ["__proto__","constructor","toString"])assert.throws(()=>answerPolicy(catalog,{serviceId:id}),/task/);}],
 ["date parser accepts a real leap day",()=>assert.deepEqual(parseVisitDate("2028-02-29"),{iso:"2028-02-29",year:2028,weekday:2})],
 ["date parser rejects rollovers, timestamps and out-of-scope years",()=>{for(const value of ["2026-02-29","2026-11-31","2026-13-01","2026-11-25T00:00:00Z","1999-12-31","2101-01-01",20261125])assert.throws(()=>parseVisitDate(value));}],
 ["duplicate place identity is refused",bad(c=>c.places.push(c.places[0]),/identity/)],
 ["a state inconsistent with its jurisdiction key is refused",bad(c=>{c.places[0].region="NC";},/identity/)],
 ["unknown source references are refused",bad(c=>{c.places[0].policies.electronics.sourceIds=["missing"];},/policy/)],
 ["unsafe source protocols are refused",bad(c=>{c.sources[0].url="javascript:alert(1)";},/source/)],
 ["source URLs with embedded credentials are refused",bad(c=>{c.sources[0].url="https://user:secret@example.org/policy";},/source/)],
 ["missing source check dates are refused",bad(c=>{c.sources[0].checkedOn="";},/date/)],
 ["future source checks cannot precede their own snapshot",bad(c=>{c.sources[0].checkedOn="2026-11-26";},/snapshot/)],
 ["duplicate source identities are refused",bad(c=>c.sources.push(c.sources[0]),/source/)],
 ["a cross-jurisdiction alternate location is refused",bad(c=>{c.places[2].policies.electronics.redirectPlaceId="perry-memorial";},/Redirect/)],
 ["an alternate with no described acceptance is refused",bad(c=>{c.places[2].policies.electronics.redirectPlaceId="union-cross-keys";},/Redirect/)],
 ["a redirect from an acceptance rather than an exclusion is refused",bad(c=>{c.places[0].policies.electronics.redirectPlaceId="union-jonesville";},/redirect/)],
 ["unscoped service hours are refused",bad(c=>{delete c.places[0].scheduleAppliesTo;},/schedule/)],
 ["invalid weekdays are refused",bad(c=>{c.places[0].schedule.days=[7];},/schedule/)],
 ["a closure date from the wrong year is refused",bad(c=>{c.closureCalendars[0].dates.push("2027-01-01");},/year/)],
 ["duplicate closure calendars are refused instead of first-match selection",bad(c=>c.closureCalendars.push(c.closureCalendars[0]),/Ambiguous/)],
 ["an orphaned closure jurisdiction is refused",bad(c=>{c.closureCalendars[0].jurisdictionId="us-ky-rowan-county";},/scope/)],
 ["policy conditions must be text",bad(c=>{c.places[0].policies.electronics.conditions=[{html:"<script>"}];},/conditions/)],
 ["answering does not mutate the checked catalog",()=>{const before=JSON.stringify(catalog);for(const p of catalog.places)for(const key of Object.keys(p.policies))ask(p.id,key,"2026-11-26");assert.equal(JSON.stringify(catalog),before);}],
 ["all modeled answers preserve unknown live availability",()=>{for(const p of catalog.places)for(const key of Object.keys(p.policies))for(const d of ["","2026-11-26","2026-11-27","2027-11-25"])assert.equal(ask(p.id,key,d).timing.availability,"UNVERIFIED");}]
 ];
}
