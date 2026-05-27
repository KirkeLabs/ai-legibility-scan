/**
 * index.js — the scan orchestrator (public API).
 *
 * Programmatic entry point:
 *   import { scan } from '@kirkelabs/ai-legibility-scan';
 *   const result = await scan('https://example.com', { agent: 'gptbot' });
 */

import { load } from 'cheerio';
import { fetchAsCrawler, fetchSibling } from './fetcher.js';
import { generateSchema, generateLlmsTxt } from './generators.js';

import * as c01 from './checks/01-server-rendered.js';
import * as c02 from './checks/02-schema-org.js';
import * as c03 from './checks/03-entity-identity.js';
import * as c04 from './checks/04-answer-shaped.js';
import * as c05 from './checks/05-fact-density.js';
import * as c06 from './checks/06-crawler-access.js';
import * as c07 from './checks/07-llms-txt.js';
import * as c08 from './checks/08-onchain-legibility.js';

const CHECKS = [c01, c02, c03, c04, c05, c06, c07, c08];

export async function scan(url, opts = {}) {
  const page = await fetchAsCrawler(url, opts);
  if (!page.ok && !page.html) {
    return {
      url,
      ok: false,
      error: page.error || `HTTP ${page.status}`,
      score: 0,
      grade: 'F',
      dimensions: [],
    };
  }

  const $ = load(page.html);

  // Fetch siblings used by some checks.
  const robots = await fetchSibling(url, '/robots.txt', opts);
  const llms = await fetchSibling(url, '/llms.txt', opts);
  const ctx = {
    $,
    html: page.html,
    finalUrl: page.finalUrl,
    headers: page.headers,
    robotsTxt: robots.ok ? robots.html : null,
    llmsTxt: llms.ok && llms.html.trim() ? llms.html : null,
  };

  const dimensions = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const mod of CHECKS) {
    const res = mod.run(ctx);
    const w = mod.meta.weight;
    weightedSum += (res.score / res.max) * w;
    weightTotal += w;
    dimensions.push({
      id: mod.meta.id,
      title: mod.meta.title,
      why: mod.meta.why,
      weight: w,
      score: res.score,
      max: res.max,
      findings: res.findings,
      detail: res.detail || {},
    });
  }

  const score = Math.round((weightedSum / weightTotal) * 100);
  return {
    url,
    finalUrl: page.finalUrl,
    ok: true,
    status: page.status,
    agent: opts.agent || 'gptbot',
    scannedAt: new Date().toISOString(),
    score,
    grade: grade(score),
    dimensions,
    generated: {
      schemaOrg: generateSchema(ctx),
      llmsTxt: generateLlmsTxt(ctx),
    },
  };
}

export function grade(s) {
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 65) return 'C';
  if (s >= 50) return 'D';
  return 'F';
}
