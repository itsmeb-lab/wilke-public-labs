export function viewLinkChecks(assert,api,catalog){
 const parse=fragment=>api.parsePolicyView(catalog,fragment);
 const view={serviceId:"farmer_oil",placeId:"union-cross-keys",visitDate:"2026-11-26"};
 return [
 ["all checked task/place rows round-trip through one canonical URL",()=>{let count=0;for(const place of catalog.places)for(const task of Object.keys(place.policies)){const input={serviceId:task,placeId:place.id,visitDate:""};const link=api.buildPolicyViewLink(catalog,input);assert.ok(link.startsWith(api.POLICY_PAGE_URL+"#task="));assert.deepEqual(parse(link.slice(link.indexOf("#"))),input);count++;}assert.equal(count,29);}],
 ["valid dates round-trip without timezone conversion",()=>{const link=api.buildPolicyViewLink(catalog,view);assert.deepEqual(parse(link.slice(link.indexOf("#"))),view);}],
 ["empty and checker anchor fragments carry no saved selection",()=>{for(const hash of ["","#","#checker"])assert.equal(parse(hash),null);}],
 ["unknown tasks and places cannot substitute another record",()=>{for(const hash of ["#task=other&place=union-airport","#task=electronics&place=other"])assert.throws(()=>parse(hash));}],
 ["valid IDs with an unsupported pairing are rejected",()=>{assert.throws(()=>parse("#task=printing&place=union-airport"));}],
 ["duplicate raw and encoded field names are rejected",()=>{for(const hash of ["#task=printing&task=printing&place=haywood-waynesville","#task=printing&%74ask=printing&place=haywood-waynesville"])assert.throws(()=>parse(hash));}],
 ["foreign jurisdiction or URL parameters cannot redirect the page",()=>{for(const suffix of ["&jurisdiction=us-nc-other","&url=https%3A%2F%2Fexample.com","&__proto__=x"])assert.throws(()=>parse("#task=printing&place=haywood-waynesville"+suffix));}],
 ["malformed encoding and empty fields are rejected",()=>{for(const hash of ["#task=%ZZ&place=union-airport","#task=electronics&place=","#task=electronics&place=union-airport&date="])assert.throws(()=>parse(hash));}],
 ["missing separators and required fields are rejected",()=>{for(const hash of ["#electronics","#task=electronics","#place=union-airport","#task&place=union-airport"])assert.throws(()=>parse(hash));}],
 ["unreal calendar dates and dates outside the supported bounds are rejected",()=>{for(const day of ["2026-02-29","1999-01-01","2101-01-01","2026-1-1"])assert.throws(()=>parse("#task=electronics&place=union-airport&date="+day));}],
 ["oversized and absolute input URLs are rejected",()=>{assert.throws(()=>parse("#task="+ "x".repeat(601)));assert.throws(()=>parse("https://example.com/#task=electronics&place=union-airport"));}],
 ["link generation does not accept arbitrary destination or unknown records",()=>{assert.throws(()=>api.buildPolicyViewLink(catalog,{...view,placeId:"https://example.com"}));assert.equal(api.buildPolicyViewLink(catalog,{...view,url:"https://example.com",jurisdictionId:"other"}),api.POLICY_PAGE_URL+"#task=farmer_oil&place=union-cross-keys&date=2026-11-26");}]
 ];
}
