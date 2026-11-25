import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { policyChecks } from "./policy-cases.mjs";
for(const [name,check] of policyChecks(assert,api,catalog))test(name,check);
