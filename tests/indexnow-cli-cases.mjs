export function cliChecks(assert,source,MANIFEST_PATH){
 const execute=async(options={})=>{
  const env={GITHUB_EVENT_PATH:"event.json",GITHUB_REPOSITORY:"itsmeb-lab/wilke-public-labs",GITHUB_EVENT_NAME:"push",GITHUB_REF:"refs/heads/main",GITHUB_RUN_ATTEMPT:"1",GITHUB_SHA:options.badSha?"bad":"a".repeat(40),GITHUB_STEP_SUMMARY:"summary.md"};
  const process={env,exitCode:undefined};const logs=[],warnings=[],calls=[];
  const event={before:"b".repeat(40)},manifest={synthetic:true};
  const readFileSync=path=>JSON.stringify(path==="event.json"?event:manifest);
  const execFileSync=(command,args,options)=>{calls.push({command,args,options});return "A\t"+MANIFEST_PATH+"\n";};
  const writeFileSync=()=>{if(options.failSummary)throw new Error("Synthetic summary failure");};
  const submitOnce=async(m,c,ports)=>{calls.push({manifest:m,context:c,fetchBound:typeof ports.fetchImpl==="function"});if(options.failSubmit)throw new Error("Synthetic precheck refusal");return options.receipt||{httpStatus:200,submissionAttempted:true,outcome:"RECEIVED_NOT_INDEXING_PROOF",indexingVerified:false};};
  const imports=['import { readFileSync, writeFileSync } from "node:fs";','import { execFileSync } from "node:child_process";','import { submitOnce, MANIFEST_PATH } from "./submit-once.mjs";'];
  let body=source;for(const line of imports){assert.equal(body.split(line).length,2);body=body.replace(line,"");}
  const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
  const forbidden=()=>{throw new Error("Unexpected real network");};
  await new AsyncFunction("readFileSync","writeFileSync","execFileSync","submitOnce","MANIFEST_PATH","process","console","fetch","AbortSignal",body)(readFileSync,writeFileSync,execFileSync,submitOnce,MANIFEST_PATH,process,{log:s=>logs.push(s),warn:s=>warnings.push(s)},forbidden,{timeout:()=>undefined});
  return {process,logs,warnings,calls};
 };
 return [
 ["actual notification CLI binds exact immutable git context before submitting",async()=>{const r=await execute();assert.equal(r.calls[0].command,"git");assert.deepEqual(r.calls[0].args,["diff","--name-status","b".repeat(40),"a".repeat(40)]);assert.equal(r.calls[0].options.timeout,5000);assert.deepEqual(r.calls[1].context.changedFiles,[{status:"A",path:MANIFEST_PATH}]);assert.equal(r.calls[1].context.runAttempt,"1");assert.equal(r.calls[1].fetchBound,true);assert.equal(r.process.exitCode,undefined);}],
 ["a failed optional summary cannot relabel a completed submission as unattempted",async()=>{const r=await execute({failSummary:true});assert.equal(r.warnings.length,1);assert.equal(r.logs.length,1);assert.ok(r.logs[0].startsWith("INDEXNOW_RECEIPT "));assert.doesNotMatch(r.logs[0],/PRECHECK_BLOCKED/);assert.equal(r.process.exitCode,undefined);}],
 ["precheck failure produces no received receipt and fails the job",async()=>{const r=await execute({failSubmit:true});assert.equal(r.logs.length,1);assert.ok(r.logs[0].startsWith("INDEXNOW_PRECHECK_BLOCKED "));assert.equal(r.process.exitCode,1);}],
 ["uncertain attempted post remains an attempted receipt and fails the job",async()=>{const r=await execute({receipt:{httpStatus:null,submissionAttempted:true,outcome:"SUBMISSION_OUTCOME_UNKNOWN"}});assert.ok(r.logs[0].includes('"submissionAttempted":true'));assert.doesNotMatch(r.logs[0],/PRECHECK_BLOCKED/);assert.equal(r.process.exitCode,1);}],
 ["202 pending ownership validation remains a received pending result",async()=>{const r=await execute({receipt:{httpStatus:202,submissionAttempted:true,outcome:"RECEIVED_KEY_VALIDATION_PENDING"}});assert.equal(r.process.exitCode,undefined);assert.match(r.logs[0],/VALIDATION_PENDING/);}],
 ["malformed immutable SHA is refused before git or submission",async()=>{await assert.rejects(()=>execute({badSha:true}),/invalid commit identifiers/);}]
 ];
}
