import { readFileSync, writeFileSync } from "node:fs";
import { catalog } from "../published-policy-lab/data.mjs";
import { renderPolicySnapshot } from "../published-policy-lab/snapshot.mjs";
import { renderPolicyCSV } from "../published-policy-lab/exchange.mjs";
const mode=process.argv[2]||"--check";
if(!["--check","--write"].includes(mode)||process.argv.length>3)throw new Error("Use --check or --write.");
const htmlPath=new URL("../published-policy-lab/index.html",import.meta.url);
const csvPath=new URL("../published-policy-lab/examples/pgp-policy-source.csv",import.meta.url);
const normalize=text=>text.replace(/\r\n/g,"\n");
const html=normalize(readFileSync(htmlPath,"utf8"));
const csv=normalize(readFileSync(csvPath,"utf8"));
const start="<!-- POLICY-SNAPSHOT:START -->",end="<!-- POLICY-SNAPSHOT:END -->";
if(html.split(start).length!==2 || html.split(end).length!==2 || html.indexOf(start)>html.indexOf(end))throw new Error("Expected exactly one ordered snapshot marker pair.");
// Validate and calculate both outputs before writing either one.
const snapshot=renderPolicySnapshot(catalog),nextCSV=renderPolicyCSV(catalog);
const nextHTML=html.slice(0,html.indexOf(start)+start.length)+"\n"+snapshot+"\n"+html.slice(html.indexOf(end));
const changes=[];
if(html!==nextHTML)changes.push({path:htmlPath,content:nextHTML,label:"HTML snapshot"});
if(csv!==nextCSV)changes.push({path:csvPath,content:nextCSV,label:"CSV exchange"});
if(mode==="--check"&&changes.length){console.error("Policy projections differ: "+changes.map(c=>c.label).join(", ")+". Review the catalog, then run policy:update.");process.exitCode=1;}
else {
 if(mode==="--write")for(const change of changes)writeFileSync(change.path,change.content,"utf8");
 console.log((mode==="--write"?"Updated ":"Checked ")+changes.length+" changed projection(s); "+catalog.places.length+" entries / "+catalog.places.reduce((n,p)=>n+Object.keys(p.policies).length,0)+" joined policy records. No publication or external request.");
}
