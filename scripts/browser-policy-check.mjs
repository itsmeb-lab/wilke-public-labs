// Isolated development fixture: preinstalled hosted Edge, localhost files only.
// No user browser profile, agency visit, account, provider call or artifact upload.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createServer as createPortProbe } from "node:net";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { catalog } from "../published-policy-lab/data.mjs";
import { SERVICES } from "../published-policy-lab/engine.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const allowed=new Set(["index.html","style.css","app.mjs","data.mjs","engine.mjs","view-link.mjs","wood-chip-load.css","wood-chip-load.mjs"]);
const served=new Map([
 ["published-policy-lab",allowed],
 ["repair-cafe-planner",new Set(["index.html","style.css"])],
 ["shelter-linen-guide",new Set(["index.html"])],
 ["milwaukee-bulky-items",new Set(["index.html"])],
 ["food-scrap-drop-off",new Set(["index.html"])],
 ["library-scanning",new Set(["index.html"])],
 ["library-museum-passes",new Set(["index.html"])],
 ["library-seed-borrowing",new Set(["index.html"])],
 ["tool-library-borrowing",new Set(["index.html"])],
 ["milwaukee-cleanout-floor-handoff",new Set(["index.html","worksheet.css"])],
 ["library-sensory-spaces",new Set(["index.html"])],
 ["eyeglass-donation-rules",new Set(["index.html"])],
 ["guide-finder",new Set(["index.html","finder.css","index-data.mjs","search.mjs","app.mjs"])],
 ["milwaukee-articulos-voluminosos",new Set(["index.html"])]
]);
const mime={html:"text/html; charset=utf-8",css:"text/css; charset=utf-8",mjs:"text/javascript; charset=utf-8"};
const driverFolder=process.env.EDGEWEBDRIVER;
if(!driverFolder)throw new Error("EDGEWEBDRIVER is required; no browser or driver will be downloaded.");
const driverPath=join(driverFolder,process.platform==="win32"?"msedgedriver.exe":"msedgedriver");
await access(driverPath);
const received=[],results=[];
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://127.0.0.1");
  if(u.pathname==="/favicon.ico"){res.writeHead(204);res.end();return;}
  const [,folder,leafName,...more]=u.pathname.split("/");
  const leaf=leafName||"index.html";
  if(leafName===undefined||more.length||!served.get(folder)?.has(leaf)){res.writeHead(404);res.end("Fixture path not served.");return;}
  received.push(leaf);
  const bytes=await readFile(join(root,folder,leaf));
  res.writeHead(200,{"content-type":mime[leaf.split(".").at(-1)]||"text/plain","cache-control":"no-store"});
  res.end(bytes);
 }catch{res.writeHead(500);res.end("Fixture read failed.");}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
const origin="http://127.0.0.1:"+server.address().port;
const page=origin+"/published-policy-lab/";
const probe=createPortProbe();
await new Promise((resolve,reject)=>{probe.once("error",reject);probe.listen(0,"127.0.0.1",resolve);});
const driverPort=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const endpoint="http://127.0.0.1:"+driverPort;
const driver=spawn(driverPath,["--port="+driverPort],{windowsHide:true,stdio:["ignore","pipe","pipe"]});
let driverError="",sessionId=null;
driver.once("error",error=>{driverError=error.message;});
driver.stderr.on("data",chunk=>{driverError=(driverError+String(chunk)).slice(-3000);});
driver.stdout.on("data",()=>{});
const deadline=setTimeout(()=>{driver.kill();server.closeAllConnections();},120000);
deadline.unref();
async function rpc(method,path,body){
 let response;
 try{response=await fetch(endpoint+path,{method,headers:{"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});}
 catch(error){throw new Error("WebDriver "+method+" "+path.replace(/\/session\/[^/]+/,"/session/{id}")+": "+error.message,{cause:error});}
 const data=await response.json();
 if(!response.ok||data.value?.error)throw new Error("WebDriver "+path+": "+(data.value?.message||response.status));
 return data.value;
}
async function ready(){
 const until=Date.now()+15000;
 while(Date.now()<until){
  if(driverError&&driver.exitCode!==null)throw new Error("Browser driver exited before readiness.");
  try{const v=await rpc("GET","/status");if(v.ready)return;}catch{}
  await delay(100);
 }
 throw new Error("Browser driver did not become ready within 15 seconds.");
}
const sid=path=>"/session/"+sessionId+path;
const execute=(script,args=[])=>rpc("POST",sid("/execute/sync"),{script,args});
const find=async selector=>(await rpc("POST",sid("/element"),{using:"css selector",value:selector}))["element-6066-11e4-a52e-4f735466cecf"];
const click=async selector=>rpc("POST",sid("/element/"+await find(selector)+"/click"),{});
async function session(width,height,javascript=true,initialPage=page){
 const opts={
  args:["--headless=new","--disable-background-networking","--disable-component-update","--no-first-run","--disable-sync","--disable-default-apps"],
  mobileEmulation:{
   deviceMetrics:{width,height,pixelRatio:1,mobile:width<800,touch:width<800},
   userAgent:width<800?"Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36"
  }
 };
 if(!javascript)opts.prefs={"profile.managed_default_content_settings.javascript":2};
 const value=await rpc("POST","/session",{capabilities:{alwaysMatch:{browserName:"MicrosoftEdge",pageLoadStrategy:initialPage===page?"normal":"none","ms:edgeOptions":opts}}});
 sessionId=value.sessionId;
 const capabilities=value.capabilities;
 await rpc("POST",sid("/timeouts"),{implicit:0,pageLoad:15000,script:10000});
 await rpc("POST",sid("/url"),{url:initialPage});
 return {browser:capabilities.browserName,version:capabilities.browserVersion,platform:capabilities.platformName};
}
async function closeSession(){if(sessionId){const closing=sessionId;sessionId=null;await rpc("DELETE","/session/"+closing);}}
const stateScript="return {\n width:document.documentElement.clientWidth,innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,\n cards:document.querySelectorAll(\".policy-card\").length,rows:document.querySelectorAll(\"[data-policy]\").length,\n task:document.getElementById(\"task\").value,place:document.getElementById(\"place\").value,date:document.getElementById(\"visit-date\").value,\n tasks:document.getElementById(\"task\").options.length,answer:document.getElementById(\"answer\").innerText,\n controls:Array.from(document.querySelectorAll(\"#checker select,#checker input,#checker button\")).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,left:r.left,right:r.right,width:r.width,height:r.height};}),\n sources:Array.from(document.querySelectorAll(\"#answer .sources a\")).map(e=>e.href),\n share:document.querySelector(\".share-view a\")?.href||null,\n active:document.activeElement?.id||\"\",\n noScriptNotice:Array.from(document.querySelectorAll(\"noscript .notice\")).some(e=>e.getBoundingClientRect().height>0),\n resourceOrigins:Array.from(new Set(performance.getEntriesByType(\"resource\").map(e=>new URL(e.name).origin)))\n};";
async function state(){return execute(stateScript);}
async function settled(){
 const until=Date.now()+10000;
 while(Date.now()<until){const s=await state();if(s.tasks===Object.keys(SERVICES).length&&s.answer.includes("Live availability:"))return s;await delay(50);}
 throw new Error("The real browser module did not render a checked answer.");
}
async function check(name,fn){
 try{const details=await fn();results.push({name,passed:true,details:details??null});}
 catch(error){results.push({name,passed:false,error:error.message});throw error;}
}
try{
 await ready();
 const expectedRows=catalog.places.reduce((n,p)=>n+Object.keys(p.policies).length,0);
 for(const [width,height]of [[320,800],[390,844],[1280,900]]){
  const runtime=await session(width,height);
  await check("actual layout and controls at "+width+"px",async()=>{
   const s=await settled();assert.equal(s.innerWidth,width,"Requested viewport did not apply.");
   if(width<800)assert.equal(s.width,width,"Mobile content viewport did not apply.");
   else assert.ok(s.width<=width&&s.width>=width-32,"Unexpected desktop scrollbar width.");
   assert.ok(s.scrollWidth<=s.width+1,"Horizontal document overflow.");
   assert.equal(s.cards,catalog.places.length);assert.equal(s.rows,expectedRows);
   for(const c of s.controls){assert.ok(c.left>=-1&&c.right<=s.width+1,"Clipped/outside control: "+JSON.stringify(c));assert.ok(c.height>=42,"Control height below fixture threshold.");}
   assert.deepEqual(s.resourceOrigins,[origin]);
   return {requestedWidth:width,observedInnerWidth:s.innerWidth,observedContentWidth:s.width,scrollWidth:s.scrollWidth,cards:s.cards,rows:s.rows,controls:s.controls.length,runtime};
  });
  await check("task exclusion and source alternate at "+width+"px",async()=>{
   const s=await state();assert.equal(s.place,"union-jonesville");assert.ok(s.answer.includes("Airport"));assert.ok(s.answer.includes("Published restriction"));
   await click("#answer button");const changed=await state();assert.equal(changed.place,"union-airport");assert.ok(changed.answer.includes("household electronics"));
  });
  await check("program scope and source facts at "+width+"px",async()=>{
   await click('[data-example="hotspot"]');const s=await state();assert.equal(s.task,"hotspot_borrowing");assert.ok(s.answer.includes("Program-level"));assert.ok(s.answer.includes("seven-day"));assert.ok(s.answer.includes("below $10"));assert.equal(s.sources.length,1);
  });
  await check("partial-day and holiday notices at "+width+"px",async()=>{
   await click('[data-example="early"]');let s=await state();assert.ok(s.answer.includes("6 p.m."));assert.ok(s.answer.includes("partial-day"));
   await click('[data-example="chips"]');s=await state();assert.equal(s.date,"2026-11-26");assert.ok(s.answer.includes("Thanksgiving"));assert.equal(s.sources.length,2);
   assert.equal(new URL(s.share).origin,"https://itsmeb-lab.github.io");assert.ok(new URL(s.share).hash.includes("date=2026-11-26"));
  });
  await check("unsupported shared view refuses then recovers at "+width+"px",async()=>{
   await rpc("POST",sid("/url"),{url:page+"#task=electronics&place=perry-memorial"});
   let s=await state();assert.ok(s.answer.includes("shared view could not be opened"));
   await click('[data-example="mulch"]');s=await state();assert.equal(s.place,"clemson-mulch-program");assert.ok(s.answer.includes("different closing times"));
  });
  await check("wood-chip nominal load and clearing stale output at "+width+"px",async()=>{
   const readyBy=Date.now()+5000;
   while(await execute("return document.getElementById('wood-chip-controls').hidden;")){
    if(Date.now()>=readyBy)throw new Error("Wood-chip calculator did not load.");
    await delay(50);
   }
   await click("#wood-chip-calc");
   const result=async()=>execute("return document.getElementById('wood-chip-result').textContent;");
   const initial=await result();
   assert.ok(initial.includes("9.26 cubic yards")&&initial.includes("10.74 cubic yards could be left over"));
   const geometry=await execute("return [...document.querySelectorAll('#wood-chip-controls input,#wood-chip-controls button')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height,width:document.documentElement.clientWidth};});");
   assert.ok(geometry.every(r=>r.left>=-1&&r.right<=r.width+1&&r.height>=42));
   await execute("const field=document.getElementById('wood-chip-area');field.value='4320';field.dispatchEvent(new Event('input'));return true;");
   assert.equal(await result(),"");
   await click("#wood-chip-calc");
   assert.ok((await result()).includes("20 cubic yards of your planned volume would still be needed"));
  });
  await rpc("POST",sid("/url"),{url:origin+"/guide-finder/"});
  await check("guide finder search, region and layout at "+width+"px",async()=>{
   const readyBy=Date.now()+6000;
   while(await execute("return document.getElementById('finder').hidden;")){
    if(Date.now()>=readyBy)throw new Error("Guide finder did not load.");
    await delay(50);
   }
   const initial=await execute("const q=document.getElementById('lookup'),s=document.getElementById('region');q.value='donate broken glasses';s.value='us-ga';q.dispatchEvent(new Event('input'));return {link:document.querySelector('#matches li li a')?.hash, text:document.getElementById('matches').innerText, width:innerWidth, scroll:document.documentElement.scrollWidth};");
   assert.equal(initial.link,"#answer--broken-frames--georgia-lions");
   assert.ok(initial.text.includes("Georgia Lions Lighthouse")&&!initial.text.includes("Minnesota"));
   assert.equal(initial.width,width);assert.ok(initial.scroll<=width+1);
   const noMatch=await execute("const q=document.getElementById('lookup');q.value='unlisted service';q.dispatchEvent(new Event('input'));return {status:document.getElementById('result-status').innerText, found:document.getElementById('matches').children.length, sources:performance.getEntriesByType('resource').map(entry=>new URL(entry.name).origin)};");
   assert.ok(noMatch.status.includes("No matching"));assert.equal(noMatch.found,0);
   assert.ok(noMatch.sources.length>0&&noMatch.sources.every(value=>value===origin));
   return {width,link:initial.link,privateLookup:true};
  });
  await closeSession();
 }
 const runtime=await session(390,844,false);
 await check("actual JavaScript-disabled static rules",async()=>{
  const s=await state();assert.equal(s.width,390);assert.equal(s.cards,catalog.places.length);assert.equal(s.rows,expectedRows);
  assert.equal(s.tasks,0,"Browser app ran despite the disabled-JavaScript fixture.");assert.ok(s.noScriptNotice,"No-script notice is not displayed.");
  assert.ok(await execute("return document.getElementById('wood-chip-controls').hidden && document.getElementById('wood-chip-load').innerText.includes('divide by 324');"));
  assert.ok(s.scrollWidth<=391);return {width:s.width,cards:s.cards,rows:s.rows,appTasks:s.tasks,runtime};
 });
 await rpc("POST",sid("/url"),{url:origin+"/guide-finder/"});
 await check("guide finder static list with JavaScript disabled",async()=>{
  const state=await execute("return {hidden:document.getElementById('finder').hidden, guides:document.querySelectorAll('.browse-guide').length, link:document.querySelector('.browse-guide a[href=\"../repair-cafe-planner/#microwave\"]')?.hash};");
  assert.equal(state.hidden,true);
  assert.equal(state.guides,10);
  assert.equal(state.link,"#microwave");
  return state;
 });
 await closeSession();
 for(const [width,height] of [[320,800],[1280,900]]){
  const cases=[
   {folder:"repair-cafe-planner",name:"repair café",anchor:"microwave",title:"Microwave",statuses:{"san-francisco":"excluded",peninsula:"unknown",toronto:"unknown","york-region":"listed",wales:"excluded","rice-county":"unknown",waverley:"excluded"}},
   {folder:"shelter-linen-guide",name:"shelter linen",anchor:"bath-towels",title:"Large bath towels",statuses:{"wisconsin-humane":"ask",charlotte:"paused","haywood-county":"ask",voorhees:"ask",christchurch:"ask","casa-grande":"listed","silicon-valley":"ask"}},
   {folder:"milwaukee-bulky-items",name:"Milwaukee bulky item",anchor:"commercial-hauler",title:"Load handled by a paid hauler",statuses:{"milwaukee-curb":"ask","milwaukee-drop-off":"ask","wauwatosa-curb":"ask","wauwatosa-drop-off":"excluded"}},
   {folder:"food-scrap-drop-off",name:"food-scrap drop-off",anchor:"compostable-plastic-bag",title:"Certified compostable plastic bag",statuses:{milwaukee:"excluded","madison-streets":"excluded","ann-arbor":"ask",minneapolis:"listed",durham:"ask",carrboro:"excluded"}},
   {folder:"library-scanning",name:"library scanning",anchor:"email",title:"Scan directly to email",statuses:{milwaukee:"listed","chapel-hill":"listed",brunswick:"excluded",addison:"listed",durham:"unknown",beaufort:"listed","southern-pines":"listed"}},
   {folder:"library-museum-passes",name:"library museum pass",anchor:"book-venue",title:"Use the pass to book a venue time",statuses:{"boston-aquarium":"listed","shorewood-betty-brinn":"excluded","berkshire-mass-moca":"unknown","burlington-partners":"ask","toronto-aga-khan":"unknown"}},
   {folder:"library-seed-borrowing",name:"seed library",anchor:"without-card",title:"Take seeds without a library card",statuses:{transylvania:"ask",canton:"excluded",cleveland:"ask","raleigh-state":"ask",longwood:"listed",waterloo:"listed",mcgill:"ask",waikato:"unknown"}},
   {folder:"tool-library-borrowing",name:"tool library",anchor:"household-borrower",title:"Borrow as a household or individual",statuses:{"milwaukee-hri":"ask","rock-hill":"listed","duluth-one-roof":"listed","charlotte-toolbank":"excluded",berkeley:"listed","london-things":"listed"}},
   {folder:"library-sensory-spaces",name:"library sensory room",anchor:"walk-in",title:"Visit without a reservation",statuses:{"durham-calming":"listed","durham-mse":"excluded","north-manchester":"listed","toronto-stewart":"excluded","moreton-bay":"listed","queensland-corner":"excluded"}},
   {folder:"eyeglass-donation-rules",name:"eyeglass donor",anchor:"loose-lenses",title:"Donate loose lenses",statuses:{"georgia-lions":"ask","minnesota-lions":"excluded","lions-in-sight":"ask","thiensville-mequon":"unknown","canadian-lions":"unknown","lions-uk":"excluded"}},
   {folder:"milwaukee-articulos-voluminosos",name:"Milwaukee articles in Spanish",anchor:"tv",title:"Televisor",statuses:{"milwaukee-curb":"excluded","milwaukee-drop-off":"listed","wauwatosa-curb":"listed","wauwatosa-drop-off":"listed"}}
  ];
  await session(width,height,false,origin+"/"+cases[0].folder+"/");
  for(const [index,testCase] of cases.entries()){
   const {folder,name,anchor,title,statuses}=testCase;
   if(index)await rpc("POST",sid("/url"),{url:origin+"/"+folder+"/"});
   await check(name+" static navigation and layout at "+width+"px",async()=>{
    const until=Date.now()+9000;
    let ready=false;
    while(Date.now()<until){
     ready=await execute("return document.readyState==='complete' && Boolean(document.getElementById(arguments[0]));",[anchor]);
     if(ready)break;
     await delay(50);
    }
    assert.ok(ready,"The static comparison did not load.");
    const activateLink=async selector=>{
     assert.equal(await execute("const link=document.querySelector(arguments[0]);link.focus();return document.activeElement===link;",[selector]),true);
     await rpc("POST",sid("/actions"),{actions:[{type:"key",id:"keyboard",actions:[{type:"keyDown",value:"\uE007"},{type:"keyUp",value:"\uE007"}]}]});
    };
    await activateLink('nav a[href="#'+anchor+'"]');
    const heading=await execute(`
     const section=document.querySelector(":target");
     const rect=section.querySelector("h2").getBoundingClientRect();
     return {id:section.id,title:section.querySelector("h2").innerText,top:rect.top,
       mobileWidth:window.innerWidth,height:window.innerHeight,content:document.documentElement.clientWidth,
       scroll:document.documentElement.scrollWidth,statuses:Object.fromEntries([...section.querySelectorAll("[data-fit]")].map(row=>[row.dataset.operator,row.dataset.fit])),
       resources:performance.getEntriesByType("resource").map(entry=>new URL(entry.name).origin)};`);
    assert.equal(heading.id,anchor);assert.equal(heading.title,title);
    assert.equal(heading.mobileWidth,width);assert.ok(heading.scroll<=heading.content+1);
    assert.ok(heading.top>=0&&heading.top<heading.height);
    assert.deepEqual(heading.statuses,statuses);
    assert.ok(heading.resources.length>0&&heading.resources.every(resource=>resource===origin));
    const operator=Object.keys(statuses)[0];
    const answer="answer--"+anchor+"--"+operator;
    await activateLink('a.answer-link[href="#'+answer+'"]');
    const card=await execute("const item=document.querySelector(':target');return {id:item.id,status:item.dataset.fit,top:item.getBoundingClientRect().top,height:innerHeight};");
    assert.equal(card.id,answer);assert.equal(card.status,statuses[operator]);
    assert.ok(card.top>=-1&&card.top<card.height);
    await activateLink('#'+anchor+' a[href="#items"]');
    assert.equal(await execute("return document.querySelector(':target').id;"),"items");
    return {width,content:heading.content,comparison:heading.title,statuses:heading.statuses};
   });
  }

  await rpc("POST",sid("/url"),{url:origin+"/milwaukee-cleanout-floor-handoff/"});
  await check("Milwaukee handoff worksheet at "+width+"px",async()=>{
   const until=Date.now()+9000;
   let ready=false;
   while(Date.now()<until){
    ready=await execute("return document.readyState==='complete' && Boolean(document.querySelector('.worksheet'));");
    if(ready)break;
    await delay(50);
   }
   assert.ok(ready);
   const layout=await execute(`
     const page=document.documentElement;
     return {width:innerWidth,client:page.clientWidth,scroll:page.scrollWidth,
       prompts:document.querySelectorAll('.worksheet dt').length,
       css:[...document.styleSheets].some(sheet=>sheet.href?.endsWith('/worksheet.css')),
       fields:document.querySelectorAll('form,input,textarea').length};
   `);
   assert.equal(layout.width,width);
   assert.ok(layout.scroll<=layout.client+1);
   assert.equal(layout.prompts,5);
   assert.equal(layout.fields,0);
   assert.ok(layout.css);
   if(width===1280){
    const encoded=await rpc("POST",sid("/print"),{orientation:"portrait",page:{width:21.59,height:27.94}});
    const pdf=Buffer.from(encoded,"base64").toString("latin1");
    assert.ok(pdf.startsWith("%PDF-"));
    const pages=pdf.match(/\/Type\s*\/Pages\b[\s\S]*?\/Count\s+(\d+)/)?.[1];
    assert.equal(Number(pages),1,"Expected the worksheet to fit on one US Letter page.");
    return {...layout,printPages:Number(pages)};
   }
   return layout;
  });

  await closeSession();
 }
 assert.ok(received.includes("app.mjs")&&received.includes("engine.mjs")&&received.includes("data.mjs"));
 console.log(JSON.stringify({schema:1,kind:"isolated_real_browser_fixture",passed:true,checks:results.length,results,limits:["Hosted Windows Edge with explicit emulation, not a physical phone or EliteBook Win10 run.","No agency, identity, booking, analytics or provider request is part of the fixture.","Layout/control assertions are not WCAG conformance or a visual pixel audit."]},null,2));
}catch(error){
 console.error(JSON.stringify({schema:1,kind:"isolated_real_browser_fixture",passed:false,results,error:error.message},null,2));process.exitCode=1;
}finally{
 clearTimeout(deadline);
 try{await closeSession();}catch{process.exitCode=1;console.error("Browser session cleanup failed.");}
 driver.kill();
 server.closeAllConnections();
 await new Promise(resolve=>server.close(resolve));
}
