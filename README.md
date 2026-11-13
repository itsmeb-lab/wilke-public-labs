# Wilke Public Labs

[![Public Labs Verification](https://github.com/itsmeb-lab/wilke-public-labs/actions/workflows/verify.yml/badge.svg)](https://github.com/itsmeb-lab/wilke-public-labs/actions/workflows/verify.yml)

Public, inspectable capability demos for automation, workflow reliability, and AI-assisted systems.

**One API, webhook or lead-form problem?** [See the $150 USD diagnostic scope](https://wilkeservices.com/software-diagnostic?utm_source=wilke_public_labs&utm_medium=referral&utm_campaign=software_diagnostic&utm_content=repository_readme). The one-time package covers one agreed JavaScript/Node.js issue: safe reproduction, focused tests, repair notes and one clarification. Implementation is separate. Inquiry first; there is no checkout in this repository.

## Why this repository exists

Freelance profiles and claims are weak evidence. This repository is the opposite: small runnable demos with source code, explicit truth boundaries, and reproducible tests.

## Live labs

### 01 — Automation Reliability Lab

Interactive browser sandbox demonstrating:

- deterministic workflow state transitions
- bounded retry and fallback recovery
- idempotency / duplicate suppression
- explicit human approval before consequential dispatch
- timestamped, downloadable event receipts
- safe no-side-effect sandbox behavior

**Live demo:** https://itsmeb-lab.github.io/wilke-public-labs/automation-reliability-lab/

![Automation Reliability Lab](./automation-reliability-lab/real-demo.png)

### 02 — Windows Process Recovery Watchdog

Real PowerShell watchdog plus an interactive browser mirror demonstrating:

- start when absent
- avoid duplicate starts while healthy
- restart after crash with a fresh PID
- timestamped watchdog receipts
- fixture tests covering all three states

**Live demo:** https://itsmeb-lab.github.io/wilke-public-labs/windows-process-recovery-watchdog/

**Public lab index:** https://itsmeb-lab.github.io/wilke-public-labs/

## Run locally

```bash
npm test
python -m http.server 8080
```

Then open either:

- `http://localhost:8080/automation-reliability-lab/`
- `http://localhost:8080/windows-process-recovery-watchdog/`

## Windows watchdog fixture

On Windows PowerShell:

```powershell
.\windows-process-recovery-watchdog\powershell\Test-ProcessWatchdog.ps1
```

## Truth boundary

These are public capability demonstrations, not paid-client production deployments, customer data, or claims of external ROI. External side effects in browser labs are deliberately simulated.

## Public-safety boundary

This repository is intentionally separate from private Wilke ecosystem repositories. It must not contain:

- credentials, tokens, cookies, or secrets
- customer or prospect private data
- private architecture or internal controller state
- absolute workstation paths
- private email addresses
- proprietary source copied from private repositories without review

## Work with me

Start with the [diagnostic scope and free handoff checklist](https://wilkeservices.com/software-diagnostic). Review the explicitly [fictional sample handoff](https://wilkeservices.com/downloads/api-webhook-diagnostic-sample.txt) before discussing a project. Written scope, permitted access, timing and payment arrangements are agreed before work begins. This diagnostic does not include Windows administration or production implementation.

Found these labs through Upwork? Keep pre-contract discussion and payment in the existing Upwork conversation. Do not use the direct-site contact route to move a marketplace relationship off-platform.

The [public sitemap](https://itsmeb-lab.github.io/wilke-public-labs/sitemap.xml) lists the three published pages. Its presence and the pages' metadata do not prove search indexing, visitors or conversions.

## License

MIT. See [LICENSE](./LICENSE).
