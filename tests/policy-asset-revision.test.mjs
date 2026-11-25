import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { catalog } from "../published-policy-lab/data.mjs";
const html=readFileSync(new URL("../published-policy-lab/index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../published-policy-lab/app.mjs",import.meta.url),"utf8");
const revision="20261125-v4";
test("browser assets use one revision bound to the published data snapshot",()=>{
 assert.equal(catalog.snapshotId,"published-policy-examples-"+revision);
 assert.ok(html.includes('src="./app.mjs?v='+revision+'"'));
 assert.ok(html.includes('href="./style.css?v='+revision+'"'));
 assert.deepEqual([...app.matchAll(/from "\.\/(?:engine|data|view-link)\.mjs\?v=([^"]+)"/g)].map(m=>m[1]),[revision,revision,revision]);
});
test("versioned module imports still resolve to existing local source files",()=>{
 const imports=[...app.matchAll(/from "(\.\/[^"]+)"/g)].map(m=>m[1]);
 assert.equal(imports.length,3);
 for(const path of imports){
  assert.match(path,/^\.\//);assert.ok(path.endsWith("?v="+revision));
  assert.ok(existsSync(new URL("../published-policy-lab/"+path.slice(2).split("?")[0],import.meta.url)));
 }
 assert.doesNotMatch(app,/from "\.\/(?:engine|data|view-link)\.mjs"/);
});

test("share-link module imports the matching engine revision",()=>{
 const source=readFileSync(new URL("../published-policy-lab/view-link.mjs",import.meta.url),"utf8");
 assert.ok(source.includes('from "./engine.mjs?v='+revision+'"'));
});
