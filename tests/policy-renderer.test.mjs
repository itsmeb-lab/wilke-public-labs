import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as api from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
import { rendererChecks } from "./policy-renderer-cases.mjs";
const source=readFileSync(new URL("../published-policy-lab/app.mjs",import.meta.url),"utf8");
for(const [name,check]of rendererChecks(assert,source,api,catalog))test(name,check);
