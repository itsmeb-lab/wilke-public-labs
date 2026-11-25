import { SERVICES, parseVisitDate, validateCatalog } from "./engine.mjs?v=20261125-v5";

export const POLICY_PAGE_URL = "https://itsmeb-lab.github.io/wilke-public-labs/published-policy-lab/";
function checkedView(catalog, value) {
 validateCatalog(catalog);
 if(!value || typeof value!=="object" || typeof value.serviceId!=="string" || !Object.hasOwn(SERVICES,value.serviceId))throw new Error("This shared view names a task outside this example set.");
 const place=catalog.places.find(p=>p.id===value.placeId);
 if(!place || !Object.hasOwn(place.policies,value.serviceId))throw new Error("This shared view does not match a checked place and task.");
 const day=parseVisitDate(value.visitDate);
 return {serviceId:value.serviceId,placeId:place.id,visitDate:day?.iso||""};
}
export function parsePolicyView(catalog, fragment) {
 if(fragment==="" || fragment==="#" || fragment==="#checker")return null;
 if(typeof fragment!=="string" || fragment.length>600 || !fragment.startsWith("#"))throw new Error("This shared view has an invalid address fragment.");
 const fields=new Map();
 for(const part of fragment.slice(1).split("&")){
  const split=part.indexOf("=");
  if(split<1)throw new Error("This shared view needs a task and place.");
  let key,value;
  try{key=decodeURIComponent(part.slice(0,split));value=decodeURIComponent(part.slice(split+1));}
  catch{throw new Error("This shared view contains invalid encoded text.");}
  if(!["task","place","date"].includes(key) || fields.has(key) || !value)throw new Error("This shared view contains an unknown, repeated or empty field.");
  fields.set(key,value);
 }
 if(!fields.has("task") || !fields.has("place"))throw new Error("This shared view needs a task and place.");
 return checkedView(catalog,{serviceId:fields.get("task"),placeId:fields.get("place"),visitDate:fields.get("date")||""});
}
export function buildPolicyViewLink(catalog, value) {
 const view=checkedView(catalog,value);
 return POLICY_PAGE_URL+"#task="+encodeURIComponent(view.serviceId)+"&place="+encodeURIComponent(view.placeId)+(view.visitDate?"&date="+encodeURIComponent(view.visitDate):"");
}
