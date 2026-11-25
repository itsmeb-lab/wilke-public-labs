export function csvProjectionChecks(assert,api,catalog){
 const copy=()=>JSON.parse(JSON.stringify(catalog));
 return [
 ["CSV projection has exactly the 17 reviewed columns and 29 joined rows",()=>{const csv=api.renderPolicyCSV(catalog);assert.equal(csv.trimEnd().split("\n").length,30);assert.equal(api.CSV_HEADERS.length,17);assert.ok(csv.startsWith('"record_id","place_name"'));}],
 ["CSV keeps program scope, primary source and unknown availability together",()=>{const csv=api.renderPolicyCSV(catalog);const line=csv.split("\n").find(row=>row.startsWith('"charlotte-hotspots-program--hotspot_borrowing"'));assert.match(line,/Mecklenburg County/);assert.match(line,/cmlibrary.org\/services\/computer-internet/);assert.ok(line.endsWith('"UNVERIFIED","EXCHANGE_ONLY_NOT_A_PAGE_APPROVAL","program"'));}],
 ["CSV preserves quotation marks, commas, ampersands and Unicode literally",()=>{const c=copy();c.places[0].policies.electronics.summary='A "quote", café & test';const csv=api.renderPolicyCSV(c);assert.ok(csv.includes('"A ""quote"", café & test"'));}],
 ["formula-leading policy text is refused rather than mutated",()=>{for(const value of ["=SUM(A1)"," +1","\t@HYPERLINK(x)","-1"]){const c=copy();c.places[0].policies.electronics.summary=value;assert.throws(()=>api.renderPolicyCSV(c),/formula-leading/);}}],
 ["multi-line cells are refused to preserve this bounded exchange format",()=>{for(const value of ["first\nsecond","first\rsecond"]){const c=copy();c.places[0].policies.electronics.summary=value;assert.throws(()=>api.renderPolicyCSV(c),/single-line/);}}],
 ["a broken source join is rejected before any projection is returned",()=>{const c=copy();c.places[0].policies.electronics.sourceIds=["missing-source"];assert.throws(()=>api.renderPolicyCSV(c),/Invalid scoped policy/);}],
 ["omitted fees and alternates remain explicit unknowns rather than zeros",()=>{const csv=api.renderPolicyCSV(catalog);const line=csv.split("\n").find(row=>row.startsWith('"haywood-waynesville--vehicle_title"'));assert.match(line,/"unstated"/);assert.match(line,/"Not stated in this snapshot.","Not applicable"/);}]
 ];
}
