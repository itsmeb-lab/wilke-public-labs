import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as api from "../published-policy-lab/exchange.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { csvProjectionChecks } from "./policy-csv-projection-cases.mjs";
for(const [name,check] of csvProjectionChecks(assert,api,catalog))test(name,check);
test("offline CSV generator exactly reproduces the saved reviewed exchange",()=>{
 const saved=readFileSync(new URL("../published-policy-lab/examples/pgp-policy-source.csv",import.meta.url),"utf8").replace(/\r\n/g,"\n");
 assert.equal(api.renderPolicyCSV(catalog),saved);
});
