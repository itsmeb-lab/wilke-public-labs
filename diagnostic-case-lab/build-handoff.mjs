#!/usr/bin/env node
// Local-only operator utility. It does not submit customer data or mark delivery accepted.
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeHandoffPackage } from './handoff-builder.mjs';

function args(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!['--input', '--out-dir'].includes(flag) || !argv[index + 1] || flag in result)
      throw new Error('Usage: node build-handoff.mjs --input <sanitized-json> --out-dir <new-private-directory>');
    result[flag] = argv[index + 1];
  }
  if (!result['--input'] || !result['--out-dir']) throw new Error('Both --input and --out-dir are required');
  return result;
}

try {
  const options = args(process.argv.slice(2));
  const inputPath = resolve(options['--input']);
  if ((await stat(inputPath)).size > 32_768) throw new Error('Input exceeds the 32 KiB evidence safety limit');
  const raw = JSON.parse(await readFile(inputPath, 'utf8'));
  const css = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), 'handoff-print.css'), 'utf8');
  const result = await writeHandoffPackage(raw, options['--out-dir'], { css });
  console.log(JSON.stringify({ result: 'PRIVATE_DRAFT_CREATED', directory: result.target,
    files: result.outputFiles, reportSha256: result.manifest.reportHtmlSha256,
    claimVerdict: result.manifest.audit.verdict, delivered: false, paid: false }, null, 2));
} catch (error) {
  console.error(`HANDOFF_BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
