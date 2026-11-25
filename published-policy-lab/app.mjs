import { SERVICES, answerPolicy, validateCatalog } from "./engine.mjs";
import { catalog } from "./data.mjs";

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
  if(result.place.address)nodes.push(el("p",result.place.address,"address"));
  if(result.conditions.length){
   const list=el("ul");for(const rule of result.conditions)list.append(el("li",rule));nodes.push(list);
  }
  if(result.fit==="described"&&(result.serviceId==="printing"||result.serviceId==="basic_notary"||result.serviceId==="vehicle_title"))nodes.push(el("p","Fee: "+result.fee,"fee"));
  if(result.redirectedPlace) {
   const next=result.redirectedPlace;
   const card=el("div",null,"redirect");
   card.append(el("p","The source points to "+next.name+" in "+next.locality+", "+next.region+"."));
   const button=el("button","Check that location");button.type="button";
   button.addEventListener("click",()=>{place.value=next.id;render();});
   card.append(button);nodes.push(card);
  }
  const timing=el("section",null,"timing");
  timing.append(el("h3","Visit-date check"),el("p",result.timing.label),el("p",result.timing.detail===result.timing.regularLabel?"Use the original source to confirm any exceptions.":result.timing.detail,"help"));
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
  output.replaceChildren(...nodes);
 }catch(error){
  output.replaceChildren(el("h2","The policy check could not be completed."),el("p",error.message),el("p","Use the original sources below to confirm the details."));
 }
}
try{
 validateCatalog(catalog);
 task.replaceChildren(...Object.entries(SERVICES).map(([id,label])=>{const option=el("option",label);option.value=id;return option;}));
 task.value="electronics";choosePlaces("union-jonesville");render();
 task.addEventListener("change",()=>{choosePlaces(place.value);render();});
 place.addEventListener("change",render);date.addEventListener("input",render);
 const examples={
  tv:["electronics","union-jonesville",""],
  title:["vehicle_title","onslow-jacksonville",""],
  printing:["printing","haywood-waynesville",""],
  holiday:["farmer_oil","union-cross-keys","2026-11-26"]
 };
 for(const button of document.querySelectorAll("[data-example]"))button.addEventListener("click",()=>{
  const [service,id,day]=examples[button.dataset.example];task.value=service;choosePlaces(id);date.value=day;render();
 });
}catch(error){output.replaceChildren(el("h2","The example catalog could not be loaded."),el("p",error.message));}
