import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { submitOnce, MANIFEST_PATH } from "./submit-once.mjs";
const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,"utf8"));
const context={repository:process.env.GITHUB_REPOSITORY,eventName:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,runAttempt:process.env.GITHUB_RUN_ATTEMPT,headSha:process.env.GITHUB_SHA,beforeSha:event.before};
if(!/^[0-9a-f]{40}$/.test(context.beforeSha||"") || !/^[0-9a-f]{40}$/.test(context.headSha||""))throw new Error("Refusing invalid commit identifiers.");
context.changedFiles=execFileSync("git",["diff","--name-status",context.beforeSha,context.headSha],{encoding:"utf8",timeout:5000}).trim().split(/\r?\n/).map(line=>{const [status,path]=line.split("\t");return {status,path};});
const manifest=JSON.parse(readFileSync(MANIFEST_PATH,"utf8"));
let receipt;
try{
 receipt=await submitOnce(manifest,context,{fetchImpl:fetch,now:()=>Date.now(),signalFor:()=>AbortSignal.timeout(15000)});
}catch(error){
 console.log("INDEXNOW_PRECHECK_BLOCKED "+JSON.stringify({message:error.message,submissionAttempted:false,indexingVerified:false}));
 process.exitCode=1;
}
if(receipt){
 console.log("INDEXNOW_RECEIPT "+JSON.stringify(receipt));
 if(process.env.GITHUB_STEP_SUMMARY)try{
  writeFileSync(process.env.GITHUB_STEP_SUMMARY,"## Finite IndexNow receipt\n\n```json\n"+JSON.stringify(receipt,null,2)+"\n```\n\nReceipt only; indexing and traffic remain unverified. No automatic retry.\n");
 }catch{console.warn("Receipt is present in job logs; the optional job summary could not be written.");}
 if(![200,202].includes(receipt.httpStatus))process.exitCode=1;
}
