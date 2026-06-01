# ai-legibility-scan

[![npm version](https://img.shields.io/npm/v/@kirkelabs/ai-legibility-scan?color=00dc94&style=flat)](https://www.npmjs.com/package/@kirkelabs/ai-legibility-scan)
[![License: MIT](https://img.shields.io/badge/license-MIT-00dc94?style=flat)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-00dc94?style=flat)](https://nodejs.org)
[![CI](https://img.shields.io/badge/CI-passing-00dc94?style=flat)](./.github/workflows/ci.yml)

**How legible is your site to an AI agent?** Run one command and find out — then get the structured data and `llms.txt` you need to fix it.

```bash
npx @kirkelabs/ai-legibility-scan https://your-site.com
```

No install. No account. No data leaves your machine.

> Built by Soleman El Gelawi (CTO, [Kirke Labs](https://www.kirkelabs.com)), with Steve Kirton — open-sourced as a gift to the Algorand ecosystem. MIT licensed. Use it, fork it, ship it.

---

## What is this?

Buyers, investors, accelerators and journalists increasingly do not Google you — they ask an AI, which reads the web *for* them and answers in a sentence or two. If your site is invisible or ambiguous to that AI, you are invisible or ambiguous to the people asking.

`ai-legibility-scan` fetches a URL **the way an AI crawler actually does** — a single plain HTTP request, no JavaScript execution, using a GPTBot/ClaudeBot/PerplexityBot user agent — and scores how well a model could understand and trust what it finds. It then **generates the artefacts to fix the gaps**: a schema.org JSON-LD scaffold and a draft `llms.txt`, plus a shareable scorecard.

It is deliberately small, dependency-light, and honest about its limits (see [Methodology](./docs/METHODOLOGY.md)).

## Why?

Most "AI visibility" tools are $300/month hosted dashboards that *monitor* but do not *act*. This one is a free CLI that tells you what is wrong and hands you the files to fix it. It is also the only one (that we know of) that scores **on-chain legibility** — whether your Algorand proof is server-rendered and explorer-linked, or trapped invisibly inside a JavaScript dashboard.

## Install

Nothing to install — use `npx`:

```bash
npx @kirkelabs/ai-legibility-scan https://your-site.com
```

Or add it to a project:

```bash
npm i -D @kirkelabs/ai-legibility-scan
```

Requires Node.js ≥ 20 (already a prerequisite if you use AlgoKit).

## Quickstart

```bash
# scan as ChatGPT's crawler (default)
npx @kirkelabs/ai-legibility-scan https://your-site.com

# scan as Claude's crawler, write artefacts to ./report
npx @kirkelabs/ai-legibility-scan https://your-site.com --agent claudebot --out ./report

# machine-readable output for scripting
npx @kirkelabs/ai-legibility-scan https://your-site.com --json
```

Five files land in the output directory (default `./ai-legibility-out/`):

| File | What it is |
|---|---|
| `score.json` | Machine-readable result — gate your CI on it |
| `report.md` | Human-readable findings |
| `schema.org.jsonld` | A JSON-LD `Organization` scaffold to complete and deploy |
| `llms.txt` | A draft `llms.txt` mined from your own pages |
| `scorecard.html` | A self-contained, shareable scorecard |

## How it scores

Eight weighted dimensions, normalised to 0–100 and graded A–F:

| # | Dimension | Weight | What it checks |
|---|---|---|---|
| 1 | Server-rendered content | 10 | Is the meaningful text in the raw HTML, or hidden behind JS? |
| 2 | Schema.org structured data | 10 | Valid JSON-LD; Organization/Person/Product; the `sameAs` graph |
| 3 | Entity identity | 10 | Links to Wikidata, Crunchbase, LinkedIn, GitHub, ORCID |
| 4 | Answer-shaped content | 8 | Opening answer, question-headings, tables |
| 5 | Fact density | 7 | Statistics and explicit sourcing per 200 words |
| 6 | AI crawler access | 7 | Does `robots.txt` block the AI bots? |
| 7 | `llms.txt` | 4 | Present and well-formed (a low-cost hedge) |
| 8 | On-chain legibility | 5 | Algorand proof server-rendered + explorer-linked |

Full rubric, thresholds and the evidence behind the weights: **[docs/METHODOLOGY.md](./docs/METHODOLOGY.md)**.

## Use in CI

The CLI exits non-zero when the score drops below 50, so you can fail a build that regresses:

```yaml
# .github/workflows/ai-legibility.yml
- run: npx @kirkelabs/ai-legibility-scan https://staging.your-site.com
```

Or parse `score.json` and set your own threshold.

## Programmatic use

```js
import { scan } from '@kirkelabs/ai-legibility-scan';

const result = await scan('https://your-site.com', { agent: 'gptbot' });
console.log(result.score, result.grade);
```

## Limitations (read this)

This tool measures **heuristic indicators** of AI legibility. A high score makes a page easier for an AI to read, trust and cite — it is **not a guarantee** of citation, and no tool can promise that. The weights are informed by public GEO/AEO research but are judgement calls, documented openly so you can disagree with them. See [Methodology](./docs/METHODOLOGY.md) and [`SECURITY.md`](./SECURITY.md).

## Companion tool — agent-readiness-scan

Once your page is legible (this tool), the next question is: can an AI agent *act* on you? **[`@kirkelabs/agent-readiness-scan`](https://github.com/KirkeLabs/agent-readiness-scan)** is the customs-house companion — it audits your declared crawler posture, MCP/ACP manifests, agent-actionable Product/Offer, and brand identity corroboration across registries. Together the two tools cover the audit-recon-fix loop for both halves of the 2026 web: legibility + declared access.

```bash
npx @kirkelabs/agent-readiness-scan https://your-site.com
```

## Audit, recon, fix — three steps to lift your score

Once the scanner has graded your site, two prompt templates let Claude Code in your source repo do the rest:

1. **[docs/RECON_PROMPT.md](./docs/RECON_PROMPT.md)** — paste into a Claude Code session in your site's source repo. It's a read-only reconnaissance prompt that greps the codebase and returns a structured 10-section report: framework, team, on-chain footprint, existing meta tags, routes, brand-asset paths, identity URLs already present in the repo, and more.
2. **[docs/PROMPT_TEMPLATE.md](./docs/PROMPT_TEMPLATE.md)** — the fix prompt, with 14 handlebars-style placeholders you fill in (some from the recon report, some you know off the top of your head). Paste the filled-in template into a *new* Claude Code session to actually do the fix.

The recon step is optional but recommended for anything beyond a brochure site. It adds ~10 minutes of round-trip and saves hours of mid-implementation course-corrections — the fix prompt is dramatically better when it's grounded in your actual file paths, framework, and on-chain footprint instead of generic assumptions.

## Contributing

Issues and PRs welcome — especially scoring false positives, new checks, and additional ecosystem explorers. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Licence

[MIT](./LICENSE) © 2026 Kirke Labs — Soleman El Gelawi and Steve Kirton. Built on Algorand-ecosystem conventions. A genuine gift to the community — attribution appreciated, not required.

— [www.kirkelabs.com](https://www.kirkelabs.com)
