import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { roomChecks } from "./policy-room-cases.mjs";
for(const [name,check] of roomChecks(assert,api,catalog))test(name,check);
