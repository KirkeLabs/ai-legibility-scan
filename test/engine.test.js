/**
 * Offline unit test for the scoring engine.
 * Runs the checks against in-memory HTML fixtures so the engine is
 * verifiable without network access (and in CI without hitting live sites).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

import * as serverRendered from '../src/checks/01-server-rendered.js';
import * as schemaOrg from '../src/checks/02-schema-org.js';
import * as entity from '../src/checks/03-entity-identity.js';
import * as onchain from '../src/checks/08-onchain-legibility.js';
import { generateLlmsTxt, generateSchema } from '../src/generators.js';
import { grade } from '../src/index.js';

const GOOD = `<!DOCTYPE html><html><head>
<title>Kirke Labs — Infrastructure for Programmable Markets</title>
<meta name="description" content="Walletless Web3 infrastructure on Algorand.">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Kirke Labs","sameAs":["https://www.wikidata.org/wiki/Q1","https://www.linkedin.com/company/x","https://github.com/x"]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Steve Kirton"}</script>
</head><body>
<h2>What is Kirke Labs?</h2>
<p>Kirke Labs builds walletless Web3 infrastructure and agentic commerce on Algorand. According to a 2025 report, settlement finality is sub-three-seconds, a 99% improvement over comparable systems. The company is the publisher of CasaLotto, a charity heritage-restoration raffle platform. This paragraph deliberately contains enough real, server-rendered prose to comfortably exceed the two-hundred-and-fifty word threshold that the server-rendered check uses to award a top score, because a credible test fixture must reflect the kind of substantive content a real explanatory page would carry rather than a token sentence. We therefore continue with several more clauses describing the mission, the team, the on-chain mechanics, the verification model, the disbursement transparency, the regulatory posture, and the broader thesis that machine legibility and human trust are the same problem viewed twice, each clause adding to the realistic word count so the heuristic behaves exactly as it would against a genuine production page in the wild.</p>
<p>Our draw contract is verifiable on-chain. Algorand Application ID:
<a href="https://allo.info/application/123456789">123456789</a>. Latest transaction:
ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRST.</p>
<a href="https://www.crunchbase.com/organization/kirke-labs">Crunchbase</a>
</body></html>`;

const BAD = `<!DOCTYPE html><html><head><title>App</title></head>
<body><div id="root"></div><script src="/bundle.js"></script></body></html>`;

test('server-rendered: rich page scores high', () => {
  const r = serverRendered.run({ $: load(GOOD), html: GOOD });
  assert.ok(r.score >= 8, `expected >=8, got ${r.score}`);
});

test('server-rendered: empty SPA shell scores low', () => {
  const r = serverRendered.run({ $: load(BAD), html: BAD });
  assert.ok(r.score <= 2, `expected <=2, got ${r.score}`);
});

test('schema-org: detects Organization + sameAs', () => {
  const r = schemaOrg.run({ $: load(GOOD), html: GOOD });
  assert.ok(r.detail.types.includes('Organization'));
  assert.ok(r.detail.types.includes('Person'));
  assert.equal(r.detail.hasSameAs, true);
  // Rubric: 2 high-value types (4pts, capped per rubric) + sameAs (4pts).
  assert.ok(r.score >= 8, `expected >=8, got ${r.score}`);
});

test('schema-org: missing schema scores zero', () => {
  const r = schemaOrg.run({ $: load(BAD), html: BAD });
  assert.equal(r.score, 0);
});

test('entity-identity: counts corroboration platforms', () => {
  const r = entity.run({ $: load(GOOD), html: GOOD });
  assert.ok(r.detail.present.includes('Wikidata'));
  assert.ok(r.detail.present.includes('GitHub'));
});

test('onchain: rewards explorer link + server-rendered IDs', () => {
  const r = onchain.run({ $: load(GOOD), html: GOOD });
  assert.equal(r.detail.applicable, true);
  assert.ok(r.score >= 8, `expected >=8, got ${r.score}`);
});

test('onchain: not applicable when no on-chain claims', () => {
  const r = onchain.run({ $: load(BAD), html: BAD });
  assert.equal(r.detail.applicable, false);
  assert.equal(r.score, 5);
});

test('generators: schema scaffold is valid JSON', () => {
  const s = generateSchema({ $: load(GOOD), finalUrl: 'https://kirkelabs.com' });
  const parsed = JSON.parse(s);
  assert.equal(parsed['@type'], 'Organization');
});

test('generators: llms.txt has H1 and blockquote', () => {
  const t = generateLlmsTxt({ $: load(GOOD), finalUrl: 'https://kirkelabs.com' });
  assert.match(t, /^#\s+/m);
  assert.match(t, /^>\s+/m);
});

test('grade thresholds', () => {
  assert.equal(grade(95), 'A');
  assert.equal(grade(82), 'B');
  assert.equal(grade(70), 'C');
  assert.equal(grade(55), 'D');
  assert.equal(grade(20), 'F');
});
