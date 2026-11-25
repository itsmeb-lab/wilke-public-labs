import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { calendarCoverageChecks } from "./policy-calendar-coverage-cases.mjs";
for(const [name,check] of calendarCoverageChecks(assert,api,catalog))test(name,check);
