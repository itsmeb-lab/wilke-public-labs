// Finite notification for two already-published project pages. No retries or tokens.
export const REPOSITORY = "itsmeb-lab/wilke-public-labs";
export const SITE = "https://itsmeb-lab.github.io/wilke-public-labs/";
export const ENDPOINT = "https://api.indexnow.org/indexnow";
export const KEY = "c6bfdc489ab9cffff80ab63e5da34ce9";
export const KEY_LOCATION = SITE+KEY+".txt";
export const MANIFEST_PATH = "ops-indexnow/submission-20261125.json";
export const WINDOW_END = "2026-11-25T15:07:13.475Z";
export const URLS = Object.freeze([SITE,SITE+"published-policy-lab/"]);
export function validateSubmission(manifest,context,now){
 if(!Number.isFinite(now) || now>=Date.parse(WINDOW_END))throw new Error("The authorized submission window has ended.");
 if(!context || context.repository!==REPOSITORY || context.eventName!=="push" || context.ref!=="refs/heads/main" || context.runAttempt!=="1")throw new Error("Only the first main-push attempt may submit.");
 if(!/^[0-9a-f]{40}$/.test(context.headSha||"") || !/^[0-9a-f]{40}$/.test(context.beforeSha||"") || context.headSha===context.beforeSha || /^0+$/.test(context.beforeSha))throw new Error("Invalid immutable commit context.");
 if(!Array.isArray(context.changedFiles) || context.changedFiles.length!==1 || context.changedFiles[0].status!=="A" || context.changedFiles[0].path!==MANIFEST_PATH)throw new Error("The commit must introduce only the one-time manifest.");
 if(!manifest || Object.getPrototypeOf(manifest)!==Object.prototype || Object.keys(manifest).sort().join(",")!=="createdAt,expiresAt,id,schema,urls")throw new Error("Unexpected manifest fields.");
 if(manifest.schema!==1 || manifest.id!=="wilke-labs-20261125" || manifest.expiresAt!==WINDOW_END)throw new Error("Unexpected submission identity or expiry.");
 const created=Date.parse(manifest.createdAt);
 if(typeof manifest.createdAt!=="string" || !/^2026-11-25T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(manifest.createdAt) || !Number.isFinite(created) || created>now || created<Date.parse("2026-11-25T11:07:13.475Z"))throw new Error("Invalid or future manifest creation time.");
 if(!Array.isArray(manifest.urls) || manifest.urls.length!==2 || new Set(manifest.urls).size!==2 || manifest.urls.some(url=>!URLS.includes(url)))throw new Error("Only the two changed canonical project URLs may be submitted.");
 return {host:"itsmeb-lab.github.io",key:KEY,keyLocation:KEY_LOCATION,urlList:[...manifest.urls]};
}
export async function submitOnce(manifest,context,{fetchImpl,now=()=>Date.now(),signalFor=()=>undefined}){
 const payload=validateSubmission(manifest,context,now());
 const base={schema:1,submissionId:manifest.id,commit:context.headSha,repository:REPOSITORY,endpoint:ENDPOINT,urls:[...payload.urlList],keyLocation:KEY_LOCATION,indexingVerified:false,trafficMeasured:false,retries:0,submissionAttempted:false};
 const checked=await fetchImpl(KEY_LOCATION,{method:"GET",redirect:"error",signal:signalFor()});
 if(checked.status!==200 || (await checked.text())!==KEY)throw new Error("The deployed project-scoped verification file did not match.");
 validateSubmission(manifest,context,now());
 const startedAt=new Date(now()).toISOString();
 let response;
 try{
  response=await fetchImpl(ENDPOINT,{method:"POST",redirect:"error",headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(payload),signal:signalFor()});
  if(!response || !Number.isInteger(response.status) || response.status<100 || response.status>599)throw new Error("No usable HTTP response.");
 }catch{
  return {...base,submissionAttempted:true,startedAt,completedAt:new Date(now()).toISOString(),outcome:"SUBMISSION_OUTCOME_UNKNOWN",httpStatus:null,detail:"The request may have reached the service. Do not retry automatically."};
 }
 const statuses={200:"RECEIVED_NOT_INDEXING_PROOF",202:"RECEIVED_KEY_VALIDATION_PENDING",400:"REQUEST_REJECTED",403:"OWNERSHIP_REJECTED",422:"URL_SCOPE_REJECTED",429:"RATE_LIMITED_NO_RETRY"};
 return {...base,submissionAttempted:true,startedAt,completedAt:new Date(now()).toISOString(),httpStatus:response.status,outcome:statuses[response.status]||"UNEXPECTED_RESPONSE_NO_RETRY",detail:"A submission receipt does not establish indexing, rankings or traffic."};
}
