import { SERVICES, answerPolicy, validateCatalog } from "./engine.mjs?v=20261125-v7";
import { catalog } from "./data.mjs?v=20261125-v7";
import { parsePolicyView, buildPolicyViewLink } from "./view-link.mjs?v=20261125-v7";

const task = document.getElementById("task");
const place = document.getElementById("place");
const date = document.getElementById("visit-date");
const output = document.getElementById("answer");
const el = (tag, text, className) => {
 const node=document.createElement(tag);
 if(text!=null)node.textContent=String(text);
 if(className)node.className=className;
 return node;
};
const fitLabels={described:"Service described in the source",excluded:"Published restriction",unstated:"This detail remains unknown"};
function choosePlaces(preferred) {
 const candidates=catalog.places.filter(p=>Object.hasOwn(p.policies,task.value));
 place.replaceChildren(...candidates.map(p=>{
  const option=el("option",p.name+" — "+p.locality+", "+p.region);
  option.value=p.id;return option;
 }));
 if(candidates.some(p=>p.id===preferred))place.value=preferred;
}
function render() {
 try {
  if(!date.validity.valid)throw new Error("Choose a date between 2000 and 2100, or leave it empty.");
  const selected=catalog.places.find(p=>p.id===place.value);
  const result=answerPolicy(catalog,{placeId:place.value,jurisdictionId:selected?.jurisdictionId,serviceId:task.value,visitDate:date.value});
  const nodes=[
   el("p",fitLabels[result.fit],"fit "+result.fit),
   el("h2",result.summary),
   el("p",result.place.name+" · "+result.place.locality+", "+result.place.region,"place-label")
  ];
  if(result.scopeNote)nodes.push(el("p",result.scopeNote,"help"));
  if(result.place.address)nodes.push(el("p",result.place.address,"address"));
  if(result.conditions.length){
   const list=el("ul");for(const rule of result.conditions)list.append(el("li",rule));nodes.push(list);
  }
  if(result.fit==="described"&&(result.serviceId==="printing"||result.serviceId==="basic_notary"||result.serviceId==="vehicle_title"||result.feeRecorded))nodes.push(el("p","Fee: "+result.fee,"fee"));
  if(result.redirectedPlace) {
   const next=result.redirectedPlace;
   const card=el("div",null,"redirect");
   card.append(el("p","The source points to "+next.name+" in "+next.locality+", "+next.region+"."));
   const button=el("button","Check that location");button.type="button";
   button.addEventListener("click",()=>{place.value=next.id;render();});
   card.append(button);nodes.push(card);
  }
  const timing=el("section",null,"timing");
  timing.append(el("h3","Date check"),el("p",result.timing.label),el("p",result.timing.detail===result.timing.regularLabel?"Use the original source to confirm any exceptions.":result.timing.detail,"help"));
  if(result.timing.regularLabel)timing.append(el("p",result.timing.regularLabel,"help"));
  timing.append(el("p","Live availability: unverified.","availability"));
  nodes.push(timing);
  const sources=el("section",null,"sources");sources.append(el("h3","Check the original sources"));
  if(!result.sources.length)sources.append(el("p","No source in this snapshot settles this task."));
  for(const source of result.sources){
   const row=el("p");const link=el("a",source.label+" ↗");link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";
   row.append(link,el("span"," · checked "+source.checkedOn,"checked"));sources.append(row);
  }
  nodes.push(sources,el("p",result.limits.join(" "),"limits"));
  const shared=el("p",null,"share-view");
  const link=el("a","Link to this policy view");
  link.href=buildPolicyViewLink(catalog,{serviceId:task.value,placeId:place.value,visitDate:date.value});
  shared.append(link);nodes.push(shared);
  output.replaceChildren(...nodes);
 }catch(error){
  output.replaceChildren(el("h2","The policy check could not be completed."),el("p",error.message),el("p","Use the original sources below to confirm the details."));
 }
}
try{
 validateCatalog(catalog);
 task.replaceChildren(...Object.entries(SERVICES).map(([id,label])=>{const option=el("option",label);option.value=id;return option;}));
 task.value="electronics";choosePlaces("union-jonesville");
 function loadSharedView(){
  try{
   const chosen=parsePolicyView(catalog,document.defaultView?.location.hash||"");
   if(!chosen)return;
   task.value=chosen.serviceId;choosePlaces(chosen.placeId);date.value=chosen.visitDate;render();
  }catch(error){output.replaceChildren(el("h2","This shared view could not be opened."),el("p",error.message),el("p","Choose a task and place above to make a new policy check."));}
 }
 render();loadSharedView();
 document.defaultView?.addEventListener("hashchange",loadSharedView);
 task.addEventListener("change",()=>{choosePlaces(place.value);render();});
 place.addEventListener("change",render);date.addEventListener("input",render);
 const examples={
  tv:["electronics","union-jonesville",""],
  title:["vehicle_title","onslow-jacksonville",""],
  printing:["printing","haywood-waynesville",""],
  holiday:["farmer_oil","union-cross-keys","2026-11-26"],
  hotspot:["hotspot_borrowing","charlotte-hotspots-program",""],
  things:["things_borrowing","clayton-things-program",""],
  meeting:["commercial_meeting","durham-rooms-program",""],
  early:["private_study","durham-rooms-program","2026-11-25"],
  mulch:["mulch_pickup","clemson-mulch-program",""],
  chips:["mulch_delivery","wakeforest-woodchips-program","2026-11-26"]
 };
 for(const button of document.querySelectorAll("[data-example]"))button.addEventListener("click",()=>{
  const chosen=examples[button.dataset.example];
  if(!chosen){output.replaceChildren(el("h2","This example is unavailable."),el("p","Choose a task above, or reload the page to see the latest examples."));return;}
  const [service,id,day]=chosen;task.value=service;choosePlaces(id);date.value=day;render();
 });
}catch(error){output.replaceChildren(el("h2","The example catalog could not be loaded."),el("p",error.message));}
