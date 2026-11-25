import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { MANIFEST_PATH } from "../ops-indexnow/submit-once.mjs";
import { cliChecks } from "./indexnow-cli-cases.mjs";
const source=readFileSync(new URL("../ops-indexnow/submit-cli.mjs",import.meta.url),"utf8");
for(const [name,check] of cliChecks(assert,source,MANIFEST_PATH))test(name,check);
