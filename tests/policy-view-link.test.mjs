import assert from "node:assert/strict";
import { test } from "node:test";
import * as api from "../published-policy-lab/view-link.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { viewLinkChecks } from "./policy-view-link-cases.mjs";
for(const [name,check] of viewLinkChecks(assert,api,catalog))test(name,check);
