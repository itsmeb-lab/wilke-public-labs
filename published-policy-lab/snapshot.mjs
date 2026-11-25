// Build-time HTML projection of the reviewed catalog; no browser or provider calls.
import { SERVICES, validateCatalog, PROGRAM_SCOPE_NOTE } from "./engine.mjs";
const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
export function renderPolicySnapshot(catalog) {
 validateCatalog(catalog);
 const sources=new Map(catalog.sources.map(source=>[source.id,source]));
 const labels={described:"Service described",excluded:"Published restriction",unstated:"Detail unknown"};
 const cards=catalog.places.map(place=>{
  const policies=Object.entries(place.policies).map(([task,policy])=>{
   const conditions=policy.fit==="described" ? (policy.conditions||[]).map(text=>"<p>"+escape(text)+"</p>").join("") : "";
   const fee=policy.fit==="described" && policy.fee ? "<p>"+escape(policy.fee)+"</p>" : "";
   const links=policy.sourceIds.map(id=>{const source=sources.get(id);return '<a href="'+escape(source.url)+'" rel="noopener noreferrer" target="_blank">'+escape(source.label)+"</a>";}).join(" · ");
   return '<li data-policy="'+escape(place.id+":"+task)+'"><h4>'+escape(SERVICES[task])+'</h4><p class="rule-status">'+labels[policy.fit]+'</p><p>'+escape(policy.summary)+"</p>"+conditions+fee+'<p class="rule-source">'+links+"</p></li>";
  }).join("\n");
  const programNote=place.recordKind==="program" ? '<p class="help">'+escape(PROGRAM_SCOPE_NOTE)+"</p>" : "";
  return '<article class="policy-card"><h3>'+escape(place.name)+'</h3><p class="checked">'+escape((place.recordKind==="program"?"Program rules · ":"")+place.locality+", "+place.region)+'</p>'+programNote+'<ul class="policy-list">'+policies+"</ul></article>";
 }).join("\n");
 return '<section class="policy-browser" aria-labelledby="browse-title">\n<h2 id="browse-title">Browse the checked rules</h2>\n<p class="snapshot">These are the same dated source notes used by the checker. They are readable without JavaScript. Use the checker above for the supplied weekday and closure patterns; confirm current access with the operator. Live availability remains unverified.</p>\n<div class="policy-grid">'+cards+"</div>\n</section>";
}
