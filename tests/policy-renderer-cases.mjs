// Minimal DOM fixture for the actual browser module. Real-browser checks are separate.
export function rendererChecks(assert,source,api,catalog) {
 class Element {
  constructor(tag="div"){this.tagName=tag;this.children=[];this.dataset={};this.listeners={};this._text="";this._value="";this.validity={valid:true};}
  set textContent(value){this._text=String(value);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join("");}
  set innerHTML(_){throw new Error("HTML sink used");}
  get innerHTML(){throw new Error("HTML sink read");}
  set value(value){this._value=String(value);}
  get value(){return this._value;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this._text="";this.children=[...children];if(this.tagName==="select"&&!children.some(c=>c.value===this.value))this.value=children[0]?.value||"";}
  addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
  fire(type){for(const fn of this.listeners[type]||[])fn({target:this});}
 }
 function fixture(data=catalog) {
  const elements=new Map([["task",new Element("select")],["place",new Element("select")],["visit-date",new Element("input")],["answer",new Element("div")]]);
  const examples=["tv","title","printing","holiday","hotspot","things"].map(id=>{const e=new Element("button");e.dataset.example=id;return e;});
  const document={getElementById:id=>elements.get(id),createElement:tag=>new Element(tag),querySelectorAll:selector=>selector==="[data-example]"?examples:[]};
  const imports=['import { SERVICES, answerPolicy, validateCatalog } from "./engine.mjs";','import { catalog } from "./data.mjs";'];
  let body=source;
  for(const line of imports){assert.equal(body.split(line).length,2,"Expected one known import");body=body.replace(line,"");}
  const forbidden=()=>{throw new Error("Unexpected network or storage access");};
  new Function("document","SERVICES","answerPolicy","validateCatalog","catalog","fetch","XMLHttpRequest","WebSocket","localStorage","navigator",body)(document,api.SERVICES,api.answerPolicy,api.validateCatalog,data,forbidden,forbidden,forbidden,undefined,undefined);
  const find=(node,predicate)=>{if(predicate(node))return node;for(const child of node.children){const found=find(child,predicate);if(found)return found;}};
  return {
   elements,examples,output:elements.get("answer"),
   example:id=>examples.find(x=>x.dataset.example===id).fire("click"),
   selectTask:value=>{elements.get("task").value=value;elements.get("task").fire("change");},
   find
  };
 }
 return [
 ["browser module renders the initial Jonesville restriction without HTML sinks",()=>{const f=fixture();assert.match(f.output.textContent,/Published restriction/);assert.match(f.output.textContent,/Airport/);assert.equal(f.elements.get("task").children.length,8);assert.equal(f.elements.get("place").children.length,3);}],
 ["alternate-location control recomputes the selected policy",()=>{const f=fixture();f.find(f.output,n=>n.tagName==="button"&&n.textContent==="Check that location").fire("click");assert.equal(f.elements.get("place").value,"union-airport");assert.match(f.output.textContent,/Service described in the source/);}],
 ["task selection scopes candidates rather than guessing similar places",()=>{const f=fixture();f.selectTask("vehicle_title");assert.equal(f.elements.get("place").children.length,4);assert.ok(f.elements.get("place").children.some(x=>/Morehead, KY/.test(x.textContent)));assert.ok(!f.elements.get("place").children.some(x=>/Jonesville/.test(x.textContent)));}],
 ["Onslow example preserves the explicit title exclusion",()=>{const f=fixture();f.example("title");assert.equal(f.elements.get("place").value,"onslow-jacksonville");assert.match(f.output.textContent,/excludes DMV forms and vehicle titles/);}],
 ["excluded title tasks do not show a fee or general notary window",()=>{const f=fixture();f.example("title");assert.match(f.output.textContent,/This task is excluded/);assert.doesNotMatch(f.output.textContent,/Fee:|Posted notary window/);}],
 ["unstated paint preparation has no implied appointment or opening window",()=>{const f=fixture();f.selectTask("paint");assert.match(f.output.textContent,/Confirm this task before planning a visit/);assert.doesNotMatch(f.output.textContent,/Published regular pattern/);}],
 ["printing example avoids inheriting notary hours",()=>{const f=fixture();f.example("printing");assert.match(f.output.textContent,/\$0\.20/);assert.match(f.output.textContent,/50 prints/);assert.doesNotMatch(f.output.textContent,/Published pattern:|Notary appointments/);}],
 ["Thanksgiving example selects the documented date and closure",()=>{const f=fixture();f.example("holiday");assert.equal(f.elements.get("visit-date").value,"2026-11-26");assert.match(f.output.textContent,/lists this date as a recycling-center closure/);assert.match(f.output.textContent,/Live availability: unverified/);}],
 ["source anchors use checked primary URLs and safe new-tab attributes",()=>{const f=fixture();const a=f.find(f.output,n=>n.tagName==="a");assert.ok(catalog.sources.some(s=>s.url===a.href));assert.equal(a.target,"_blank");assert.equal(a.rel,"noopener noreferrer");}],
 ["an invalid date surfaces a helpful refusal",()=>{const f=fixture();const d=f.elements.get("visit-date");d.validity.valid=false;d.fire("input");assert.match(f.output.textContent,/between 2000 and 2100/);assert.doesNotMatch(f.output.textContent,/Service described/);}],
 ["markup-like source content stays literal text",()=>{const c=JSON.parse(JSON.stringify(catalog));const marker='<img src=x onerror="synthetic">';c.places.find(p=>p.id==="union-jonesville").policies.electronics.summary=marker;const f=fixture(c);const h=f.find(f.output,n=>n.tagName==="h2");assert.equal(h.textContent,marker);assert.equal(h.children.length,0);}],
 ["hotspot preset shows program scope without a fabricated pickup address",()=>{const f=fixture();f.example("hotspot");assert.equal(f.elements.get("place").value,"charlotte-hotspots-program");assert.match(f.output.textContent,/Program-level rules/);assert.match(f.output.textContent,/seven days without renewal/);assert.equal(f.find(f.output,n=>n.className==="address"),undefined);}],
 ["program selection keeps live stock and date-specific access unverified",()=>{const f=fixture();f.selectTask("hotspot_borrowing");assert.equal(f.elements.get("place").children.length,1);assert.match(f.output.textContent,/No visit window is modeled/);assert.match(f.output.textContent,/Live availability: unverified/);assert.doesNotMatch(f.output.textContent,/in stock|ready for pickup|Published regular pattern/);}],
 ["things preset retains card-specific and separate item-group limits",()=>{const f=fixture();f.example("things");assert.match(f.output.textContent,/Hocutt-Ellington/);assert.match(f.output.textContent,/two kit items plus one technology item/);assert.match(f.output.textContent,/additional lending rules/);}],
 ["a broken catalog shows the original-source fallback instead of a fabricated answer",()=>{const c=JSON.parse(JSON.stringify(catalog));c.sources[0].url="http://invalid.example/policy";const f=fixture(c);assert.match(f.output.textContent,/catalog could not be loaded/);assert.doesNotMatch(f.output.textContent,/Service described/);}]
 ];
}
