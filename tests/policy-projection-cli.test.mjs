import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const script="scripts/update-policy-projections.mjs";
const run=(dir,mode)=>spawnSync(process.execPath,[join(dir,script),mode],{cwd:dir,encoding:"utf8",timeout:20000});
const text=path=>readFileSync(path,"utf8").replace(/\r\n/g,"\n");
test("actual projection CLI checks the repository without changing either output",()=>{
 const html=readFileSync(join(root,"published-policy-lab/index.html"));
 const csv=readFileSync(join(root,"published-policy-lab/examples/pgp-policy-source.csv"));
 const result=run(root,"--check");assert.equal(result.status,0,result.stderr);
 assert.deepEqual(readFileSync(join(root,"published-policy-lab/index.html")),html);
 assert.deepEqual(readFileSync(join(root,"published-policy-lab/examples/pgp-policy-source.csv")),csv);
 assert.match(result.stdout,/No publication or external request/);
});
test("actual projection CLI repairs stale projections only in a disposable fixture",()=>{
 const tempRoot=resolve(tmpdir()),fixture=mkdtempSync(join(tempRoot,"public-policy-projections-"));
 try{
  const files=[script,"published-policy-lab/data.mjs","published-policy-lab/engine.mjs","published-policy-lab/snapshot.mjs","published-policy-lab/exchange.mjs","published-policy-lab/index.html","published-policy-lab/examples/pgp-policy-source.csv"];
  for(const file of files){const target=join(fixture,file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,readFileSync(join(root,file)));}
  const html=join(fixture,"published-policy-lab/index.html"),csv=join(fixture,"published-policy-lab/examples/pgp-policy-source.csv");
  writeFileSync(html,text(html).replace(/(<!-- POLICY-SNAPSHOT:START -->)[\s\S]*?(<!-- POLICY-SNAPSHOT:END -->)/,"$1\nSYNTHETIC STALE RULES\n$2"));
  writeFileSync(csv,'"SYNTHETIC STALE CSV"\n');
  assert.equal(run(fixture,"--check").status,1);
  const written=run(fixture,"--write");assert.equal(written.status,0,written.stderr);
  assert.equal(text(html),text(join(root,"published-policy-lab/index.html")));
  assert.equal(text(csv),text(join(root,"published-policy-lab/examples/pgp-policy-source.csv")));
  assert.equal(run(fixture,"--check").status,0);
  const beforeHTML=readFileSync(html),beforeCSV=readFileSync(csv);
  const data=join(fixture,"published-policy-lab/data.mjs");writeFileSync(data,text(data).replace("https://des.sc.gov/","http://des.sc.gov/"));
  assert.equal(run(fixture,"--write").status,1);
  assert.deepEqual(readFileSync(html),beforeHTML);assert.deepEqual(readFileSync(csv),beforeCSV);
  assert.equal(run(fixture,"--delete").status,1);
 }finally{
  const target=resolve(fixture);
  if(dirname(target)!==tempRoot || !basename(target).startsWith("public-policy-projections-"))throw new Error("Refusing unsafe fixture cleanup path.");
  rmSync(target,{recursive:true,force:true});
 }
});
