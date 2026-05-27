#!/usr/bin/env node
/**
 * bin/cli.js — command-line entry point.
 *
 * Usage:
 *   npx @kirkelabs/ai-legibility-scan https://example.com
 *   npx @kirkelabs/ai-legibility-scan https://example.com --agent claudebot --out ./report
 *   npx @kirkelabs/ai-legibility-scan https://example.com --json
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { scan } from '../src/index.js';
import { renderScorecard } from '../src/scorecard.js';

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function parseArgs(argv) {
  const args = { url: null, agent: 'gptbot', out: './ai-legibility-out', json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--agent') args.agent = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-')) args.url = a;
  }
  return args;
}

function help() {
  console.log(`
${BOLD}ai-legibility-scan${RESET} — how legible is your site to AI agents?

${BOLD}Usage${RESET}
  npx @kirkelabs/ai-legibility-scan <url> [options]

${BOLD}Options${RESET}
  --agent <name>   Crawler UA to emulate: gptbot | claudebot | perplexitybot | google  (default: gptbot)
  --out <dir>      Output directory  (default: ./ai-legibility-out)
  --json           Print machine-readable JSON to stdout (good for CI)
  -h, --help       Show this help

${BOLD}Outputs written to <dir>${RESET}
  score.json          Machine-readable result (CI-gateable)
  report.md           Human-readable report
  schema.org.jsonld   Draft Organization JSON-LD scaffold
  llms.txt            Draft llms.txt scaffold
  scorecard.html      Shareable static scorecard

MIT · Kirke Labs · www.kirkelabs.com
`);
}

function color(level) {
  return level === 'pass'
    ? GREEN
    : level === 'warn'
      ? YELLOW
      : level === 'fail'
        ? RED
        : DIM;
}

function bar(pct, width = 22) {
  const fill = Math.round((pct / 100) * width);
  return '█'.repeat(fill) + '░'.repeat(width - fill);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.url) {
    help();
    process.exit(args.url ? 0 : 1);
  }

  let url = args.url;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  if (!args.json) {
    console.log(`\n${CYAN}⟶  Scanning ${BOLD}${url}${RESET}${CYAN} as ${args.agent}…${RESET}\n`);
  }

  const result = await scan(url, { agent: args.agent });

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }

  if (!result.ok) {
    console.error(`${RED}✗ Could not scan: ${result.error}${RESET}\n`);
    process.exit(2);
  }

  const gColor =
    result.grade === 'A' || result.grade === 'B'
      ? GREEN
      : result.grade === 'C'
        ? YELLOW
        : RED;

  console.log(
    `${BOLD}  AI-Legibility Score: ${gColor}${result.score}/100  (${result.grade})${RESET}\n`,
  );

  for (const d of result.dimensions) {
    const pct = Math.round((d.score / d.max) * 100);
    const c = pct >= 70 ? GREEN : pct >= 40 ? YELLOW : RED;
    console.log(
      `  ${c}${bar(pct)}${RESET}  ${d.title} ${DIM}(${d.score}/${d.max}, weight ${d.weight})${RESET}`,
    );
    for (const f of d.findings) {
      console.log(`     ${color(f.level)}•${RESET} ${f.msg}`);
    }
    console.log('');
  }

  // Write artefacts.
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'score.json'), JSON.stringify(result, null, 2));
  await writeFile(join(outDir, 'report.md'), toMarkdown(result));
  await writeFile(join(outDir, 'schema.org.jsonld'), result.generated.schemaOrg);
  await writeFile(join(outDir, 'llms.txt'), result.generated.llmsTxt);
  await writeFile(join(outDir, 'scorecard.html'), renderScorecard(result));

  console.log(`${DIM}  Artefacts written to ${outDir}/${RESET}`);
  console.log(
    `${DIM}    score.json · report.md · schema.org.jsonld · llms.txt · scorecard.html${RESET}\n`,
  );
  console.log(
    `${DIM}  Heuristic indicators, not a guarantee of AI citation. See docs/METHODOLOGY.md${RESET}\n`,
  );

  // Non-zero exit on a failing grade — useful as a CI gate.
  process.exit(result.score >= 50 ? 0 : 3);
}

function toMarkdown(r) {
  let md = `# AI-Legibility Report\n\n`;
  md += `**URL:** ${r.url}  \n**Score:** ${r.score}/100 (${r.grade})  \n`;
  md += `**Crawler emulated:** ${r.agent}  \n**Scanned:** ${r.scannedAt}\n\n`;
  md += `> Heuristic indicators of how legible this page is to AI agents (ChatGPT, Claude, Perplexity, Gemini). Not a guarantee of AI citation.\n\n`;
  for (const d of r.dimensions) {
    md += `## ${d.title} — ${d.score}/${d.max}\n\n_${d.why}_\n\n`;
    for (const f of d.findings) md += `- **${f.level.toUpperCase()}** — ${f.msg}\n`;
    md += `\n`;
  }
  md += `---\n\nGenerated by [\`@kirkelabs/ai-legibility-scan\`](https://github.com/KirkeLabs/ai-legibility-scan) — MIT. Built by Soleman El Gelawi (CTO, Kirke Labs), with Steve Kirton (www.kirkelabs.com) as a gift to the Algorand ecosystem.\n`;
  return md;
}

main().catch((e) => {
  console.error(`${RED}Unexpected error:${RESET}`, e);
  process.exit(1);
});
