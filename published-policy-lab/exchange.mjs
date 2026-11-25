// Offline projection of the reviewed joins; not a WordPress import adapter.
import { SERVICES, validateCatalog } from "./engine.mjs";
export const CSV_HEADERS = Object.freeze(["record_id","place_name","state","locality","jurisdiction_id","task_id","task_label","policy_fit","policy_summary","conditions","fee_description","alternate_place_id","source_urls","checked_on","live_availability","publication_status","record_kind"]);
function cell(value){
 if(typeof value!=="string" || /[\r\n]/.test(value))throw new Error("CSV exchange cells must be single-line text.");
 if(/^[\t ]*[=+@-]/.test(value))throw new Error("CSV exchange refuses formula-leading text.");
 return '"'+value.replace(/"/g,'""')+'"';
}
export function renderPolicyCSV(catalog){
 validateCatalog(catalog);
 const sources=new Map(catalog.sources.map(source=>[source.id,source.url]));
 const sourceChecks=new Map(catalog.sources.map(source=>[source.id,source.checkedOn]));
 const rows=catalog.places.flatMap(place=>Object.entries(place.policies).map(([task,policy])=>[
  place.id+"--"+task,place.name,place.region,place.locality,place.jurisdictionId,
  task,SERVICES[task],policy.fit,policy.summary,
  (policy.conditions||[]).join(" / ")||"No additional condition recorded; check the source.",
  policy.fee||"Not stated in this snapshot.",policy.redirectPlaceId||"Not applicable",
  policy.sourceIds.map(id=>sources.get(id)).join(" / "),policy.sourceIds.map(id=>sourceChecks.get(id)).sort()[0],
  "UNVERIFIED","EXCHANGE_ONLY_NOT_A_PAGE_APPROVAL",place.recordKind||"place"
 ]));
 return [CSV_HEADERS,...rows].map(row=>row.map(cell).join(",")).join("\n")+"\n";
}
