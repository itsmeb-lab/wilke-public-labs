import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { mulchChecks } from "./policy-mulch-cases.mjs";
for(const [name,check] of mulchChecks(assert,api,catalog))test(name,check);
