import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as api from "../ops-indexnow/submit-once.mjs";
import { submissionChecks } from "./indexnow-cases.mjs";
for(const [name,check] of submissionChecks(assert,api))test(name,check);
test("public ownership file and workflow retain exact finite scope",()=>{
 const key=readFileSync(new URL("../"+api.KEY+".txt",import.meta.url),"utf8");
 assert.equal(key,api.KEY);
 const workflow=readFileSync(new URL("../.github/workflows/indexnow-once.yml",import.meta.url),"utf8");
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/persist-credentials: false/);
 assert.match(workflow,/runs-on: ubuntu-latest/);
 assert.match(workflow,/timeout-minutes: 2/);
 assert.doesNotMatch(workflow,/schedule:|cron:|workflow_dispatch:|secrets\.|write-all|contents: write|upload-artifact|cache:/);
 assert.ok(workflow.includes(api.MANIFEST_PATH));
});
